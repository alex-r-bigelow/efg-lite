var windowBounds = {
    width : 200,
    height : 200
};

var data = {
        nodes : [
            {
                attrs : {
                    label : "",
                    id : 0
                }
            }
        ],
        links : []
    },
    currentNode = 0,
    force,
    drag,
    node,
    link,
    cursor;

var nodeRadius = 10;

function getCleanData() {
    var temp = {'nodes':[],'links':[]};
    var attr;
    data.nodes.forEach(function (d, i) {
        d.attrs.id = i;
        temp.nodes.push(d.attrs);
    });
    data.links.forEach(function (d) {
        temp.links.push({
            source : d.source.attrs.id,
            target : d.target.attrs.id
        });
    });
    return temp;
}

function moveCursor() {
    cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
}

function addNode() {
    var point = d3.mouse(this),
        nodeId = data.nodes.length,
        node = {
            x: point[0],
            y: point[1],
            attrs : {
                label : "",
                id : nodeId
            }
        },
        n = data.nodes.push(node);
    
    currentNode = nodeId;

    // add links to any nearby nodes
    data.nodes.forEach(function (target) {
        var x = target.x - node.x,
            y = target.y - node.y;
        if (target !== node && Math.sqrt(x * x + y * y) < 60) {
            data.links.push({
                source: node,
                target: target
            });
        }
    });

    update();
}

function clickNode (d, i) {
    currentNode = d.attrs.id | i;
    d3.event.sourceEvent.stopPropagation();
    update();
}

function clickLink (d, i) {
    var temp = data.links[i].source;
    data.links[i].source = data.links[i].target;
    data.links[i].target = temp;
    d3.event.stopPropagation();
    update();
}

function editNode () {
    try {
        var temp = JSON.parse(this.value);
        data.nodes[currentNode].attrs = temp;
        d3.select(this).style('color','black');
        d3.selectAll('.node')
            .filter(function (d, i) {
                return d.attrs.id === currentNode || i === currentNode;
            }).select('text').text(temp.label);
    } catch(err) {
        d3.select(this).style('color','red');
    }
}

function tick() {
    link.attr('d', drawPointyArc);

    node.attr("transform", function (d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });
}

function update() {
    link = link.data(data.links);
    
    link.enter().append("path")
        .attr("class", "link")
        .on('mousedown', clickLink);
    link.exit().remove();
    
    node = node.data(data.nodes);
    
    var nodeContainer = node.enter().append("g")
        .attr('class', 'node')
        .call(force.drag);
    nodeContainer.append('circle')
        .attr({
            r : nodeRadius
        });
    nodeContainer.append('text')
        .attr({
            x : nodeRadius * 2,
            y : nodeRadius / 2
        });
    node.exit().remove();
    
    node.attr('class', function (d, i) {
        return d.attrs.id === currentNode || i === currentNode ? 'node selected' : 'node';
    });
    node.selectAll('text').text(function (d, i) {
        return d.attrs.label;
    });
    
    d3.select('#editor')
        .property("value",JSON.stringify(data.nodes[currentNode].attrs));

    force.start();
}

function drawPointyArc(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        arcRadius = 10 * dx / Math.abs(dx),
        theta,
        edgePoint,
        front,
        back,
        arc;
    
    if (dx === 0) {
        if (dy >= 0) {
            theta = Math.PI;
        } else {
            theta = -Math.PI;
        }
        edgePoint = {
            x : 0,
            y : nodeRadius
        };
    } else {
        theta = Math.atan((d.target.y - d.source.y)/(d.target.x - d.source.x)) + Math.PI / 2;
        edgePoint = {
            x : nodeRadius * Math.cos(theta),
            y : nodeRadius * Math.sin(theta)
        };
    }
    front = {
        x : d.source.x + edgePoint.x,
        y : d.source.y + edgePoint.y
    };
    back = {
        x : d.source.x - edgePoint.x,
        y : d.source.y - edgePoint.y
    };
    arc = {
        x : (d.source.x + d.target.x) / 2 + arcRadius * Math.cos(theta),
        y : (d.source.y + d.target.y) / 2 + arcRadius * Math.sin(theta)
    };
    return "M" + 
        front.x + "," + 
        front.y + "Q" + 
        arc.x + "," +
        arc.y + "," +
        d.target.x + "," + 
        d.target.y + "Q" +
        arc.x + "," +
        arc.y + "," +
        back.x + "," +
        back.y + "Z";
}

function restart() {
    if (force !== undefined) {
        force.stop();
    }
    
    force.nodes(data.nodes)
        .links(data.links);
    
    var svg = d3.select('#view');
    node = svg.select('#nodes').selectAll(".node");
    link = svg.select('#links').selectAll(".link");
    
    update();
}

function fixSvgSize() {
    windowBounds = {
        width : window.innerWidth,
        height : window.innerHeight
    };
    d3.select('#view').attr({
        'width': windowBounds.width,
        'height': windowBounds.height
    });
    force.size([windowBounds.width, windowBounds.height]);
    update();
}

function updateFileMenu() {
    var fileNames = Object.keys(localStorage);
    var fileMenu = d3.select('#savedFiles');
    var menuItems = fileMenu.selectAll('option')
        .data(fileNames);
    
    menuItems.enter().append('option');
    menuItems.exit().remove();
    menuItems.attr('value', function (d) { return d; })
        .text(function (d) { return d; });
    
    fileMenu = document.getElementById('savedFiles');
    var currentFile = d3.select('#filename').property('value');
    var i;
    for (i = 0; i < fileMenu.length; i += 1) {
        if (fileMenu.options[i].value === currentFile) {
            fileMenu.options[i].selected = true;
            break;
        }
    }
    switchFile();
}

function saveFile() {
    localStorage.setItem(d3.select('#filename').property('value'), JSON.stringify(getCleanData()));
    updateFileMenu();
}

function deleteFile() {
    localStorage.removeItem(d3.select('#filename').property('value'));
    updateFileMenu();
}

function switchFile() {
    var currentFile = d3.select('#savedFiles').property('value');
    data = {
        nodes : [],
        links : []
    };
    
    if (localStorage.hasOwnProperty(currentFile)) {
        var temp = JSON.parse(localStorage.getItem(currentFile));
        temp.nodes.forEach(function (d) {
            data.nodes.push(
                {
                    attrs : d
                }
            );
        });
        data.links = temp.links;
        d3.select('#filename').property('value',currentFile);
    } else {
        data.nodes.push({
            attrs : {
                label : "",
                id : 0
            }
        });
        d3.select('#filename').property('value', 'Untitled');
    }
    currentNode = 0;
    restart();
}

function downloadFile() {
    var content = JSON.stringify(getCleanData());
    var filename = d3.select('#filename').property('value');
    if (!filename.endsWith('.json')) {
        filename += '.json';
    }
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
}

function init() {    
    var svg = d3.select("#view")
        .on("mousemove", moveCursor)
        .on("mousedown", addNode);

    d3.select('#editor')
        .on("keyup", editNode);
    
    d3.select('#saveButton')
        .on("click", saveFile);
    
    d3.select('#deleteButton')
        .on("click", deleteFile);
    
    d3.select('#savedFiles')
        .on("change", switchFile);
    
    d3.select('#downloadMenu')
        .on("change", downloadFile)
    
    cursor = svg.append("circle")
        .attr("r", 60)
        .attr("transform", "translate(-100,-100)")
        .attr("class", "cursor");
    
    force = d3.layout.force()
        .size(windowBounds)
        .linkDistance(60)
        .charge(-60)
        .on("tick", tick);
    drag = force.drag();
    drag.on('dragstart', clickNode);
    
    updateFileMenu();
    
    fixSvgSize();
    window.onresize = fixSvgSize;
}
window.onload = init;