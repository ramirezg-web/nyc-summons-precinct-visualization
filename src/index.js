'use strict';

import d3 from 'd3';
import d3_queue from 'd3-queue';
import chroniton from 'chroniton';

var width = window.innerWidth,
    height = window.innerHeight;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var slider = d3.select("body").append("slider");

var numById = {};
var years = [
    "CY2007",
    "CY2008",
    "CY2009",
    "CY2010",
    "CY2011",
    "CY2012",
    "CY2013",
    "CY2014",
    "2015 YTD 03/31"
];
var yearMap = {
    "2007": "CY2007",
    "2008": "CY2008",
    "2009": "CY2009",
    "2010": "CY2010",
    "2011": "CY2011",
    "2012": "CY2012",
    "2013": "CY2013",
    "2014": "CY2014",
    "2015": "2015 YTD 03/31"
}

for(var year of years) {
    numById[year] = {};
}

var currentYear = years[0];
var violation = "URINATING IN PUBLIC";

var projection = d3.geo.mercator()
    .center([-73.94, 40.70])
    .scale(50000)
    .translate([(width) / 2, (height)/2]);

var path = d3.geo.path()
    .projection(projection);


d3_queue.queue()
    .defer(d3.json, "data/police_precincts.geojson")
    .defer(d3.csv, "data/clean-summons-data.csv", row => {
        if (row.Violation === violation) {
            for(var year of years) {
                numById[year][row.Precinct] = row[year];
            }
        }
    })
    .await(ready);

function update(precinct) {
    svg.append("g")
        .attr("id", "precincts")
        .selectAll(".precinct")
        .data(precinct.features)
        .enter().append("path")
        .attr("class", "precinct")
        .style("fill", d => {
            var numViolations = numById[currentYear][d.properties.Precinct];
            if (numViolations < 10) {
                return "white";
            }
            if (numViolations < 100) {
                return "blue";
            }
            return "red";
        })
        .attr("d", path);
}

function ready(error, precinct) {
    if (error) throw error;

    update(precinct);

    slider.append("foo")
        .call(
            chroniton()
                .domain([new Date(2007, 1, 1), new Date(2015, 1, 1)])
                .labelFormat(date => { yearMap[date.getFullYear()] })
                .width(width / 2)
                .on("change", date => {
                    var newYear = yearMap[date.getFullYear()];
                    if (newYear != currentYear) {
                        currentYear = newYear;
                        svg.selectAll("path").remove();
                        update(precinct);
                    }
                })
                .loop(true)
        );
}
