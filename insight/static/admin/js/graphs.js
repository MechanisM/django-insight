var IGraphs = IGraphs || {}; // namespace for Insight Graphs

// Initialize global IGraphs variables here
IGraphs.init = function() {
    IGraphs.container = d3.select("#graphs");
};

/*
 * Base Graph object
 */
IGraphs.Graph = function(title, width, height) {
    this.title = title;
    this.width = width;
    this.height = height;
    if (IGraphs.container) {
        this.chart = IGraphs.container.append("svg:svg")
            .attr("class", "graph")
            .attr("width", width)
            .attr("height", height);
        this.chart.append("svg:text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + width/2 + "," + 20 + ")")
            .text(title);
    }
};

IGraphs.Graph.prototype = {
    constructor: IGraphs.Graph,
    draw: function(element) {
        // override in children
    },
    updateData: function() {
        // override in children
    },
    selectTableData: function(table_id, column_indices, column_names) {
        var data = [];
        var rows = d3.selectAll("#" + table_id + " tbody tr");
        for (var i = 0; i < rows[0].length; i++) {
            var row = d3.select(rows[0][i]).selectAll("td, th");
            var r = {}
            for (var j = 0; j < column_indices.length; j++)
                r[column_names[j]] = row[0][column_indices[j]].innerText;
            data.push(r);
        }
        return data;
    },
};

/*
 * PieChart object
 */
IGraphs.PieChart = function(title, width, height, radius) {
    IGraphs.Graph.call(this, title, width, height);
    this.slices = this.chart.append("svg:g")
        .attr("class", "slices")
        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
    this.arc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .innerRadius(radius/2)
        .outerRadius(radius);
    this.radius = radius;
};

IGraphs.PieChart.prototype = new IGraphs.Graph();
IGraphs.PieChart.prototype.constructor = IGraphs.PieChart;
IGraphs.PieChart.prototype.supr = IGraphs.Graph.prototype;

IGraphs.PieChart.prototype.updateData = function(table_id, key_column_index, value_column_index) {
    this.data = this.supr.selectTableData.call(
        this,
        table_id, 
        [key_column_index, value_column_index], 
        ['key', 'value']
    );
    return this.data;
};

IGraphs.PieChart.prototype.draw = function(element) {
    var pieHelper = d3.layout.pie().value(function(d) {return d.value;});
    var pieData = pieHelper(this.data);
    var total = 0;
    pieData.filter(function(element, index, array) {
        total += element.value;
        return (element.value > 0);
    });
    
    if (pieData.length > 0) {
        // assign local pointers to instance attributes
        var arc = this.arc;
        var data = this.data;
        var radius = this.radius;
        // helper functions
        var alignText = function(d) {
            return (d.startAngle + d.endAngle)/2 > Math.PI ? "end" : "start";
        };
        var calcOffset = function(d) {
            var c = arc.centroid(d);
            var h = Math.sqrt(c[0]*c[0] + c[1]*c[1]);
            var r = radius + 16;
            return "translate(" + c[0]/h * r + "," + c[1]/h * r + ")";
        };
        var getColour = d3.scale.category20();        
        // create the svg elements
        this.chart.select(".title")
            .attr("transform", "translate(" + this.width/2 + "," + this.height/2 + ")");
        var slices = this.slices.selectAll("path").data(pieData);
        slices.enter().append("svg:g")
            .attr("class", "slice");
        slices.append("svg:path")
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .attr("fill", function(d, i) { return getColour(i); })
            .attr("d", this.arc);
        slices.append("svg:text")
            .attr("class", "label")
            .attr("text-anchor", alignText)
            .attr("transform", calcOffset)
            .text(function(d, i) { return data[i].key; });
        slices.append("svg:text")
            .attr("class", "percentage")
            .attr("dy", "1.5em")
            .attr("text-anchor", alignText)
            .attr("transform", calcOffset)
            .text(function(d, i) { return (data[i].value * 100.0 / total + "%"); });
        slices.exit().remove();
    }
};