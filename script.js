//set margins
var margin = {top: 25, right: 100, bottom: 25, left: 25};
var width = 700;
var height = 400;
var chartWidth = 0.67*width - margin.right
var chartHeight = height - margin.top*6
var smallWidth = 0.33*width
var smallHeight = 0.25*height

//boxplot colors and labels
var colors = {0: ['#a85c0f','#cc9060','#eac6ad'], //orange
              1: ['#2c4443','#6d7e7d','#b4bdbc'], //teal
              2: ['#5e5c30','#928e6f','#c8c6b5'], //green
              3: ['#a0892b','#c3ae72','#e3d6b6'], //yellow
              4: ['#27333d','#687078','#b1b5ba'], //blue
              5: ['#5b5b5b','#8f8f8f','#c6c6c6'], //grey
              6: ['#894229','#b57e6a','#dcbdb2']}  //red

var tooltipColors =  {0: '#efddd1', //orange
                      1: '#d4d9d8', //teal
                      2: '#deddd5', //green
                      3: '#ece5d5', //yellow
                      4: '#d3d5d7', //blue
                      5: '#dddddd', //grey
                      6: '#e8d9d3'}  //red

var xLabels = {'judge_race': 'Judge Race', 'judge_gender': 'Judge Gender',
                'appointed_by': 'Judge Party Affiliation',
                'def_race': 'Defendant Race', 'def_gender': 'Defendant Gender',
                'vic_gender': 'Victim Gender', 'recruit': 'Method of Recruitment',
                'type': 'Type of Trafficking', 'region': 'U.S. Region',
                'year_group': 'Year'}

//set up svgs and charts
var svg = d3.select("#chart")
            .attr('style', 'padding-bottom: ' + Math.ceil(height*100 / width) + '%')
            .append('svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height)

var chart = svg.append('g')
                .attr('height', chartHeight)
                .attr('width', chartWidth)
                .attr("transform", "translate(" + 0.33*width + "," + 2*margin.top + ")");

var smallChart = svg.append('g')
                      .attr('width', smallWidth)
                      .attr('height', smallHeight)
                      .attr('transform', 'translate(0,' + 0.75*height + ')')

var sidebar = svg.append('g')
                  .attr('width', smallWidth)
                  .attr('height', height - 2*margin.top - smallWidth)
                  .attr('transform', 'translate(' + margin.left + ',' + 2*margin.top + ')')

//append title
svg.append('text')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('id', 'title')
    .text('Human Trafficking: How Do Prison Sentences Vary?')

//load data
d3.json("ht_sentencing.json", function(error, data) {
  if (error) throw error;

  dataset = data;

  dataset.forEach(function (d) {
    d.sentence = +d.sentence;
    d.foreign_vics = +d.foreign_vics;
    d.recruit = +d.recruit;
    d.region = +d.region;
    d.def_race = +d.def_race;
    d.def_gender = +d.def_gender;
    d.judge_race = +d.judge_race;
    d.judge_gender = +d.judge_gender;
    d.appointed_by = +d.appointed_by;
    d.type = +d.type;
    d.year_group = +d.year_group;
    d.vic_gender = +d.vic_gender;
  });

  //draw initial chart
  drawOptions();
  drawSideChart();
  drawChart(sortMethod = 'ascending', selectedVariable = 'type', method='update');
  drawGrid();
  //xLabel();
  //applyFootnotes();
  update();
  window.setTimeout('delayScatters(dataset)', 1);
  window.setTimeout('getSortMenu()', 1);
}); //end load data



function getData() {

  var filteredData = dataset.filter(function(d) {return !isNaN(d[selectedVariable]);});
  var nestedData = d3.nest()
      .key(function(d) {return d[selectedVariable];})
      .rollup(function(v) {return {
                min: d3.min(v, function(d) {return d.sentence}),
                q1: d3.quantile(v.map(function(d) {return d.sentence;}).sort(d3.ascending), 0.25),
                median: d3.median(v, function(d) {return d.sentence;}),
                q3: d3.quantile(v.map(function(d) {return d.sentence;}).sort(d3.ascending), 0.75),
                max: d3.max(v, function(d) {return d.sentence;}),
                count: v.length
                };
              })
      .entries(filteredData);

  if (sortMethod == 'ascending') {
    nestedData.sort(function(a, b) {
            if (a.value.median == b.value.median) {
              return d3.ascending(a.value.q3, b.value.q3)
            }

            else {return d3.ascending(a.value.median, b.value.median)}
            }
    ); //end sort
  } //end if

  else if (sortMethod == 'descending') {
    nestedData.sort(function(a, b) {
            if (a.value.median == b.value.median) {
              return d3.descending(a.value.q3, b.value.q3)
            }

            else {return d3.descending(a.value.median, b.value.median)}
            }
    ); //end sort
  } //end else if

  return nestedData;
} //end getData
//
//
//
//
function getScales(finalData) {

  var xScale = d3.scaleBand()
                  .domain(finalData.map(function(d) {return d.key;}))
                  .range([0,chartHeight]);

  var yScale = d3.scaleLinear()
                  .domain([30, 0])
                  .range([chartWidth, 0]);

  return {'x': xScale, 'y': yScale}
} //end getScales



function drawOptions() {
  var labels = [{'label': 'Type of Trafficking', 'x': 16, 'id': 'type'},
                {'label': 'Defendant Race', 'x': 29, 'id': 'def_race'},
                {'label': 'Defendant Gender', 'x': 42, 'id': 'def_gender'},
                {'label': 'Victim Gender', 'x': 55, 'id': 'vic_gender'},
                {'label': 'Method of Recruitment', 'x' : 68, 'id': 'recruit'},
                {'label': 'Judge Race', 'x': 81, 'id': 'judge_race'},
                {'label': 'Judge Gender', 'x': 94, 'id': 'judge_gender'},
                {'label': 'Judge Party Affiliation', 'x': 107, 'id': 'appointed_by'},
                {'label': 'U.S. Region', 'x': 120, 'id': 'region'},
                {'label': 'Year', 'x': 133, 'id': 'year'}]

  var sorting = [{'label': 'Ascending', 'x': 181, 'id': 'ascending'},
                 {'label': 'Descending', 'x': 194, 'id': 'descending'}]

  //append include header
  sidebar.append('text')
          .attr('class', 'side-header')
          .attr('x', 0)
          .attr('y', 5)
          .text('Examine by:')

  //create groups for include options
  options = sidebar.selectAll("circle.option-groups")
                        .data(labels)
                        .enter()
                        .append('g')
                        .attr('class', 'option-groups')
                        .attr('id', function(d) {return d.id})

  //append circles for include options
  options.append('circle')
          .attr('cx', 4)
          .attr('cy', function(d) {return d.x})
          .attr('r', 4)
          .attr('id', function(d) {return 'circle_' + d.id})
          .attr('fill', 'white')
          .attr('stroke-width', 0.25)
          .attr('stroke', 'black')
          // .on('mouseover', function(d) {
          //       d3.select(this)
          //         .style('cursor', 'pointer')
          //         .transition()
          //         .duration(500)
          //         .attr('fill', '#898989')})
          // .on('mouseout', function(d) {
          //       d3.select(this)
          //         .style('cursor', 'default')
          //         .transition()
          //         .duration(500)
          //         .attr('fill', 'white')})

  //append text for include options
  options.append('text')
          .attr('class', 'include-text')
          .attr('x', 12)
          .attr('y', function(d, i) {return 18 + i*13})
          .text(function(d) {return d.label})

  //append sort header
  sidebar.append('text')
          .attr('class', 'side-header')
          .attr('x', 0)
          .attr('y', 170)
          .text('Sort:')

  //create groups for sort options
  sortMenu = sidebar.append('g')
                    .attr('id', 'sort-menu')

  sortOptions = sortMenu.selectAll("circle.sort-circles")
                        .data(sorting)
                        .enter()
                        .append('g')
                        .attr('class', 'sort-circles')
                        .attr('id', function(d) {return d.id})

  //append circles for sort options
  sortOptions.append('circle')
              .attr('cx', 4)
              .attr('cy', function(d) {return d.x})
              .attr('r', 4)
              .attr('id', function(d) {return 'circle_' + d.id})
              .attr('fill', 'white')
              .attr('stroke-width', 0.25)
              .attr('stroke', 'black')
              // .on('mouseover', function(d) {
              //       d3.select(this)
              //         .style('cursor', 'pointer')
              //         .transition()
              //         .duration(500)
              //         .attr('fill', '#898989')})
              // .on('mouseout', function(d) {
              //       d3.select(this)
              //         .style('cursor', 'default')
              //         .transition()
              //         .duration(500)
              //         .attr('fill', 'white')})

  //append text for sort options
  sortOptions.append('text')
              .attr('class', 'sort-text')
              .attr('x', 12)
              .attr('y', function(d, i) {return 183 + i*13})
              .text(function(d) {return d.label})

  //explode all text and button
  sidebar.append('text')
          .attr('x', 0)
          .attr('y', 231)
          .attr('class', 'side-header')
          .text('Explode plots:')

  sidebar.append('rect')
          .attr('x', margin.left*2.7)
          .attr('y', 221)
          .attr('height', 15)
          .attr('width', 23)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('id', 'oval')
          .attr('fill', '#898989')
          .on('mouseover', function(d) {
                d3.select(this).style('cursor', 'pointer')},

              'mouseout', function(d) {
                d3.select(this).style('cursor', 'default')
          })

    sidebar.append('circle')
              .attr('cx', margin.left*3) //3.32 on transition...
              .attr('cy', 228.5)
              .attr('r', 6)
              .attr('id', 'explode-button')
              .attr('fill', 'white')
              .on('mouseover', function(d) {
                d3.select(this).style('cursor', 'pointer')},

                'mouseout', function(d) {
                  d3.select(this).style('cursor', 'default')
                })

    // mouseover effect:
    // https://stackoverflow.com/questions/36326683/d3-js-how-can-i-set-the-cursor-to-hand-when-mouseover-these-elements-on-svg-co

    //defaults
    var defaultVariable = d3.select('#circle_type')
    selectOption(defaultVariable, 'type')

    var defaultSort = d3.select('#circle_ascending')
    selectOption(defaultSort, 'ascending')
}




function drawSideChart(view='box') {

  var xPoints = {'min': [margin.left, 'minimum'], 'q1': [margin.left+32.75, '25th percentile'],
                'med': [margin.left+65.5, 'median'], 'q3': [margin.left+98.25, '75th percentile'],
                'max': [smallWidth-margin.left*3, 'maximum']
                };

  if (view == 'box') {

    for (var x in xPoints) {
      //append text
      smallChart.append('text')
                .attr('class', 'desc box-desc box-desc-text')
                .attr('transform', 'rotate(25' + ',' + xPoints[x][0] + ',' + (margin.top*1.6) + ')')
                .attr('x', xPoints[x][0])
                .attr('y', margin.top*1.6)
                .text(xPoints[x][1])
                .attr('opacity', 1)

      //append lines
      smallChart.append('line')
                .attr('class', 'desc box-desc')
                .attr('x1', xPoints[x][0])
                .attr('y1', margin.top*1.15)
                .attr('x2', xPoints[x][0])
                .attr('y2', margin.top*1.4)
                .attr('stroke-width', 0.25)
                .attr('stroke', 'black')
                .attr('opacity', 1)
    } //end loop

    //append min and max bars
    smallChart.append('rect')
              .attr('class', 'desc box-desc')
              .attr('y', margin.top/1.3)
              .attr('x', xPoints.min[0])
              .attr('width', xPoints.max[0] - xPoints.min[0])
              .attr('height', 0.015*height)
              .style('fill', '#d6d6d6')
              .attr('opacity', 1);

    //append iqr bars
    smallChart.append('rect')
              .attr('class', 'desc box-desc')
              .attr('y', margin.top/1.3)
              .attr('x', xPoints.q1[0])
              .attr('width', xPoints.q3[0] - xPoints.q1[0])
              .attr('height', 0.015*height)
              .style('fill', '#afafaf')
              .attr('opacity', 1);

    //append median
    smallChart.append('circle')
              .attr('class', 'desc box-desc')
              .attr('cx', xPoints.med[0])
              .attr('cy', margin.top / (margin.top / (margin.top / 1.3 + 0.0075*height)))
              .attr('r', 0.015*height)
              .style('fill', '#898989')
              .attr('opacity', 1);
  }

  else if (view == 'dots') {

    Math.seedrandom('setting-the-seed') //https://www.npmjs.com/package/seedrandom

    var dots = []

    for (i=0; i<10; i++) {
      dots.push(margin.left*((Math.random() * 6) + 1))
    }

    var description = ['Each dot represents one defendant. Its horizonal',
                        'position represents the prison sentence that the',
                        'defendant received.']

    smallChart.selectAll('circle')
              .data(dots)
              .enter()
              .append('circle')
              .attr('class', 'desc dot-desc')
              .attr('cx', function(d) {return d})
              .attr('cy', function(d, i) {
                if (i%4 == 0) {return margin.top}
                else if (i%3 == 0) {return margin.top*1.2 + Math.random()*10}
                else if (i%2 == 0) {return margin.top*0.8 + Math.random()*10}
                else {return margin.top*0.6 + Math.random()*10}})
              .attr('r', 2)
              .attr('opacity', 0.6)

    smallChart.selectAll('text.desc')
              .data(description)
              .enter()
              .append('text')
              .attr('x', margin.left)
              .attr('y', function(d,i) {
                 if (i === 0) {return margin.top*2}
                 else if (i === 1) {return margin.top*2.25}
                 else {return margin.top*2.5}
              })
              .attr('class', 'desc dot-desc dot-desc-text')
              .text(function(d) {return d})
              .attr('opacity', 1)
    }
}; // end makeSideChart

function drawChart(sortMethod, selectedVariable, method='update') {

  finalData = getData(sortMethod, selectedVariable)
  scales = getScales(finalData);
  xScale = scales.x
  yScale = scales.y

  //create gradient to fade max lines https://www.freshconsulting.com/d3-js-gradients-the-easy-way/
  var defs = chart.append("defs");

  var gradient = defs.append("linearGradient")
     .attr("id", "svgGradient")
     .attr("x1", "0%")
     .attr("x2", "100%")
     .attr("y1", "0%")
     .attr("y2", "0%");

  gradient.append("stop")
     .attr('class', 'start')
     .attr("offset", "0%")
     .attr("stop-color", "#f4f4f4")
     .attr("stop-opacity", 0);

  gradient.append("stop")
     .attr('class', 'end')
     .attr("offset", "100%")
     .attr("stop-color", "#f4f4f4")
     .attr("stop-opacity", 1);

  //add variable labels
  appendLabels(xScale, yScale, selectedVariable, method);

  if (method === 'update') {
    xLabel(selectedVariable);
  }

  //create boxplot groups
  boxplotGroups = chart.selectAll("rect")
                        .data(finalData)
                        .enter()
                        .append('g')
                        .attr('id', function(d) {return 'plot' + d.key})
                        .attr('class', 'plot')
                        .attr('opacity', 1)

  //append min lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.q1)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr('height', 0.03*chartHeight)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.min);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr("width", function(d) {return yScale(d.value.q1 - d.value.min);})
                .attr("height", 0.03*chartHeight)
                .attr("fill", function(d) {return colors[d.key][2]})
                .attr('opacity', 1);

  //append max lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.q3)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr('height', 0.03*chartHeight)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.q3);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr("width", function(d) {
                  if (d.value.max > 30) {return yScale(30-d.value.q3)}
                  else {return yScale(d.value.max - d.value.q3);}
                })
                .attr("height", 0.03*chartHeight)
                .attr("fill", function(d) {return colors[d.key][2]})
                .attr('opacity', 1);

  //append gradient lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(25)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr('height', 0.03*chartHeight)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(2000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(25);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr("width", function(d) {
                  if (d.value.max > 30) {return yScale(5)}
                  else {return 0}
                })
                .attr("height", 0.03*chartHeight)
                .attr('fill', 'url(#svgGradient)')
                .attr('opacity', 1);

  //append q1 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.median)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr('height', 0.03*chartHeight)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.q1);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr("width", function(d) {return yScale(d.value.median - d.value.q1);})
                .attr("height", 0.03*chartHeight)
                .attr("fill", function(d) {return colors[d.key][1]})
                .attr('opacity', 1);

  //append q3 lines
  boxplotGroups.append("rect")
                .attr('x', function(d) {return yScale(d.value.median)})
                .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr('height', 0.03*chartHeight)
                .attr('width', 0)
                .transition()
                .duration(1000)
                .delay(1000)
                .attr('class', 'boxplot')
                .attr("x", function(d) {return yScale(d.value.median);})
                .attr("y", function(d) {return xScale(d.key) + xScale.bandwidth()/2 - 0.015*chartHeight;})
                .attr("width", function(d) {return yScale(d.value.q3 - d.value.median);})
                .attr("height", 0.03*chartHeight)
                .attr("fill", function(d) {return colors[d.key][1]})
                .attr('opacity', 1);

  //append circles
  boxplotGroups.append('circle')
                .attr('cy', function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
                .attr('cx', -20)
                .attr('r', 0.03*chartWidth)
                .transition()
                .duration(1000)
                .attr('clip-path', 'url(#chart-area)')
                .attr('class', 'boxplot')
                .attr("cy", function(d) {return xScale(d.key) + xScale.bandwidth()/2;})
                .attr("cx", function(d) {return yScale(d.value.median);})
                .attr("r", 0.025*chartWidth)
                .attr('stroke-width', 1.5)
                .attr('stroke', 'white')
                .attr("fill", function(d) {return colors[d.key][0]})
                .attr('opacity', 1);

  //clip path for medians
  chart.append('clipPath')
        .attr('id', 'chart-area')
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', chartWidth)
        .attr('height', chartHeight)

  tooltips();
  // //tooltip on
  // boxplotGroups.on('mouseover', function(d) {
  //   var plot = d3.select(this);
  //   var xValues = plot._groups[0][0].__data__.value;
  //   var y = parseFloat(plot._groups[0][0].childNodes[0].attributes[1].value);
  //   var color = plot._groups[0][0].__data__.key;
  //   var coordinates = d3.mouse(this);
  //   var xCoord = coordinates[0];
  //
  //   var stats = {'min': 'min: ', 'q1': '25%: ', 'median': 'median: ',
  //                 'q3': '75%: ', 'max': 'max: ', 'count': 'cases: '}
  //
  //
  //
  //   //comparison line
  //   chart.append('line')
  //         .attr('x1', -10)
  //         .attr('y1', 0)
  //         .attr('x2', -10)
  //         .attr('y2', 1.1*chartHeight)
  //         .attr('stroke-width', 3)
  //         .attr('stroke', 'black')
  //         .attr('stroke-dasharray', '5,5')
  //         .attr('opacity', 0.25)
  //         .transition()
  //         .duration(500)
  //         .attr('x1', yScale(xValues.median))
  //         .attr('y1', 0)
  //         .attr('x2', yScale(xValues.median))
  //         .attr('y2', chartHeight)
  //         .attr('stroke-width', 2)
  //         .attr('stroke', 'black')
  //         .attr('stroke-dasharray', '5,5')
  //         .attr('opacity', 0.25)
  //         .attr('class', 'tools')
  //         .attr('clip-path', 'url(#chart-area)')
  //
  //   //box to hold stats
  //   chart.append('rect')
  //         .attr('class', 'tools')
  //         .attr('x', xCoord)
  //         .attr('y', y + 15)
  //         .attr('width', 2.5*margin.top)
  //         .attr('height', 2.45*margin.top)
  //         .attr('fill', '#f4f4f4')
  //         .attr('opacity', 0)
  //         .transition()
  //         .duration(1000)
  //         .attr('x', xCoord)
  //         .attr('y', y + 15)
  //         .attr('width', 2.5*margin.top)
  //         .attr('height', 2.45*margin.top)
  //         .attr('fill', function() {return tooltipColors[color]})
  //         .attr('opacity', 1)
  //
  //   var i = margin.top
  //   for (var v in xValues) {
  //     label = String(xValues[v])
  //
  //     chart.append('text')
  //           .attr('x', xCoord + 6)
  //           .attr('y', y + i)
  //           .attr('opacity', 0)
  //           .transition()
  //           .duration(500)
  //           .attr('x', xCoord + 6)
  //           .attr('y', y + i)
  //           .attr('opacity', 1)
  //           .attr('class', 'tools')
  //           .text(stats[v] + label.slice(0,4));
  //
  //     i = i + 9
  //   } //end loop
  // }); //end tooltip on
  //
  // //tooltip off
  // boxplotGroups.on('mouseout', function() {
  //   d3.selectAll('.tools')
  //     .transition()
  //     .duration(500)
  //     .attr('opacity', 0)
  //     .remove();
  //  })
}; //end drawChart


function tooltips() {
  //tooltip on
  boxplotGroups.on('mouseover', function(d) {
    var plot = d3.select(this);
    var xValues = plot._groups[0][0].__data__.value;
    var y = parseFloat(plot._groups[0][0].childNodes[0].attributes[1].value);
    var color = plot._groups[0][0].__data__.key;
    var coordinates = d3.mouse(this);
    var xCoord = coordinates[0];

    var stats = {'min': 'min: ', 'q1': '25%: ', 'median': 'median: ',
                  'q3': '75%: ', 'max': 'max: ', 'count': 'cases: '}



    //comparison line
    chart.append('line')
          .attr('x1', -10)
          .attr('y1', 0)
          .attr('x2', -10)
          .attr('y2', 1.1*chartHeight)
          .attr('stroke-width', 3)
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.25)
          .transition()
          .duration(500)
          .attr('x1', yScale(xValues.median))
          .attr('y1', 0)
          .attr('x2', yScale(xValues.median))
          .attr('y2', chartHeight)
          .attr('stroke-width', 2)
          .attr('stroke', 'black')
          .attr('stroke-dasharray', '5,5')
          .attr('opacity', 0.25)
          .attr('class', 'tools')
          .attr('clip-path', 'url(#chart-area)')

    //box to hold stats
    chart.append('rect')
          .attr('class', 'tools')
          .attr('x', xCoord)
          .attr('y', y + 15)
          .attr('width', 2.5*margin.top)
          .attr('height', 2.45*margin.top)
          .attr('fill', '#f4f4f4')
          .attr('opacity', 0)
          .transition()
          .duration(1000)
          .attr('x', xCoord)
          .attr('y', y + 15)
          .attr('width', 2.5*margin.top)
          .attr('height', 2.45*margin.top)
          .attr('fill', function() {return tooltipColors[color]})
          .attr('opacity', 1)

    var i = margin.top
    for (var v in xValues) {
      label = String(xValues[v])

      chart.append('text')
            .attr('x', xCoord + 6)
            .attr('y', y + i)
            .attr('opacity', 0)
            .transition()
            .duration(500)
            .attr('x', xCoord + 6)
            .attr('y', y + i)
            .attr('opacity', 1)
            .attr('class', 'tools')
            .text(stats[v] + label.slice(0,4));

      i = i + 9
    } //end loop
  }); //end tooltip on

  //tooltip off
  boxplotGroups.on('mouseout', function() {
    d3.selectAll('.tools')
      .transition()
      .duration(500)
      .attr('opacity', 0)
      .remove();
   })
}


function appendLabels(xScale, yScale, selectedVariable, method) {

  var races = {0: 'White', 1: 'Black', 2: 'Hispanic', 3: 'Asian', 4: 'Indian', 5: 'Other'}
  var genders = {0: 'Male', 1: 'Female'}
  var parties = {0: 'Democrat', 1: 'Republican'}
  var methods = {0: 'Unknown/other', 1: 'Online', 2: 'Kidnap', 3: 'Face-to-Face',
                4: 'Telephone', 5: 'Family', 6: 'Newspaper'}
  var types = {0: 'Labor trafficking', 1: 'Adult sex trafficking', 2: 'Minor sex trafficking'}
  var regions = {0: 'South', 1: 'Northeast', 2: 'West', 3: 'Midwest'}
  var years = {0: '2000-2003', 1: '2004-2007', 2: '2008-2011', 3: '2012-2015'}

  var labels = {'judge_race': races, 'judge_gender': genders,
                'appointed_by': parties, 'def_race': races,
                'def_gender': genders, 'vic_gender': genders,
                'recruit': methods, 'type': types, 'region': regions,
                'year_group': years}

  var varLabels = chart.selectAll(".text")
        .data(finalData)
        .enter()
        .append("text")
        .attr('x', 1.01*chartWidth)
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('fill', '#f4f4f4')
        .transition()
        .duration(1500)
        .attr('class', 'var-labels')
        .attr('id', function(d) {return 'label' + d.key})
        .attr('x', 1.01*chartWidth)
        .attr('y', function(d) {return xScale(d.key) + xScale.bandwidth()/2 + 1;})
        .attr('text-anchor', 'left')
        .attr('alignment-baseline', 'middle')
        .attr('fill', 'black')
        .text(function(d) {return labels[selectedVariable][d.key]})

  if (method === 'update') {
    var footnotes = {'type':  'Some cases involve multiple types of trafficking.' +
                          ' To avoid confusion, cases included here involved' +
                          ' one of these three types exclusively.',

                  'vic_gender': 'Some cases involve victims of multiple genders.' +
                                ' To avoid confusion, cases included here involved' +
                                ' one of these two genders exclusively.'
                }

    if (selectedVariable === 'type' || selectedVariable === 'vic_gender') {
      chart.append('text')
            .attr('class', 'variable-footnote')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('x', 0)
            .attr('y', chartHeight + margin.top*2.75)
            .attr('opacity', 1)
            .text(footnotes[selectedVariable])
    }
  };

}; //end appendLabels
//
//
//
//
function xLabel(selectedVariable) {

  chart.append("text")
    .attr('transform', 'rotate(-90' + ',' + -10 + ',' + chartHeight/2 + ')')
    .attr("y", chartHeight/2)
    .attr("x", -10)
    .style('fill', '#f4f4f4')
    .transition()
    .duration(1500)
    .attr("class", "axisLabel")
    .attr('id', 'x-label')
    .attr('transform', 'rotate(-90' + ',' + -10 + ',' + chartHeight/2 + ')')
    .attr("y", chartHeight/2)
    .attr("x", -10)
    .style('fill', 'black')
    .attr('text-anchor', 'middle')
    .text(function() {
      return xLabels[selectedVariable]
    });
}; //end xLabel



function drawGrid() {

  finalData = getData();
  scales = getScales(finalData);
  yScale = scales.y

  //draw y axis
  var grid = chart.append('g')
                  .attr('id', 'grid')

  grid.append('g')
      .call(d3.axisBottom(yScale)
              .tickSizeInner(0)
              .tickSizeOuter(0)
              .tickPadding(1.015*chartHeight)
              .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]))
      .attr('id', 'grid-ticks')

  //create gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  function make_x_gridlines() {return d3.axisBottom(yScale)}

  //draw gridlines https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  grid.append("g")
        .attr("class", "lines")
        .call(make_x_gridlines()
            .tickSize(chartHeight)
            .tickFormat("")
            .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30]))

  //remove horizonal lines from y axis https://bl.ocks.org/mbostock/3371592
  function customYAxis(g) {
    grid.call(yScale);
    grid.select(".domain").remove();
  }

  //run this twice because there are two horizonal lines to remove
  for (i=0; i<2; i++) {
    grid.append("g")
         .call(customYAxis);
  }

  //y axis label
  grid.append("text")
    .attr("class", "axisLabel")
    .attr("y", chartHeight*1.1)
    .attr("x", yScale(15))
    .attr('text-anchor', 'middle')
    .text("Length of Sentence (in years)");

  //permanent footnotes
  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .on('click', function() {
          window.open('http://www.humantraffickingdata.org')
        })
        .on('mouseover', function(d) {
          d3.select(this)
            .style('cursor', 'pointer')
            .transition()
            .duration(500)
            .style('opacity', 0.5)
        })
        .on('mouseout', function(d) {
            d3.select(this)
              .style('cursor', 'default')
              .transition()
              .duration(500)
              .style('opacity', 1)
          })
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', chartHeight + margin.top*1.5)
        .attr('opacity', 1)
        .text('Source: www.HumanTraffickingData.org')

  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', chartHeight + margin.top*2)
        .attr('opacity', 1)
        .text('Sentences longer than 30 years are more than 1.5' +
              ' times higher than the 75th percentile and are' +
              ' therefore considered outliers.')

  chart.append('text')
        .attr('class', 'permanent-footnote')
        .attr('opacity', 0)
        .transition()
        .duration(1000)
        .attr('x', 0)
        .attr('y', chartHeight + margin.top*2.25)
        .attr('opacity', 1)
        .text('These account for about 4% of all sentences, ' +
              'and are excluded from this graph. Hover over each plot ' +
              'to view actual maximum sentences.')

}; //end drawGrid
//
//
//
//
// function applyFootnotes(selectedVariable='type') {
//
//   //variable-specific footnotes
//   // var selectedVariable = d3.select('input[name = "variable"]:checked')
//   //                           .property("value");
//
//   var footnotes = {'type':  'Some cases involve multiple types of trafficking.' +
//                         ' To avoid confusion, cases included here involved' +
//                         ' one of these three types exclusively.',
//
//                 'vic_gender': 'Some cases involve victims of multiple genders.' +
//                               ' To avoid confusion, cases included here involved' +
//                               ' one of these two genders exclusively.'
//               }
//
//   if (selectedVariable === 'type' || selectedVariable === 'vic_gender') {
//     chart.append('text')
//           .attr('class', 'variable-footnote')
//           .attr('opacity', 0)
//           .transition()
//           .duration(1000)
//           .attr('x', 0)
//           .attr('y', chartHeight + margin.top*2.75)
//           .attr('opacity', 1)
//           .text(footnotes[selectedVariable])
//   };
// }; //end applyFootnotes()
//
//




function selectOption(circle, id) {
  circle.attr('fill', 'black')

  if (id === 'ascending' | id === 'descending') {
    window.sorting = id
  }

  else {
    window.selectedID = id
  }
}; //end selectOption



function unselectOption(circle) {
  circle.attr('fill', 'white')
}; //end unselectOption



//sort boxplots
function getSortMenu() {
  var asc = d3.select('#ascending')
  var desc = d3.select('#descending')
  var aCircle = d3.select('#circle_ascending')
  var dCircle = d3.select('#circle_descending')

  asc.on('click', function() {
    selectOption(aCircle, 'ascending')
    unselectOption(dCircle)
    sortPlots(sortMethod='ascending')
  })

  desc.on('click', function() {
    selectOption(dCircle, 'descending')
    unselectOption(aCircle)
    sortPlots(sortMethod='descending')
  })
}



function sortPlots(sortMethod) {
  //transition explode button and reset chart diagram
  var explodeCircle = d3.select('#explode-button');
  var desc = d3.selectAll('.desc');
  var oval = d3.select('#oval');
  explodeCircle.transition().duration(500).attr('cx', margin.left*3)
  oval.transition().duration(500).attr('fill', '#898989')
  desc.remove();
  drawSideChart(view='box');
  removePlots(method='sort');
  drawChart(sortMethod=sortMethod, selectedVariable=window.selectedID, method='sort');
  window.setTimeout('delayScatters(dataset)', 3000);

}



//update boxplots
function update() {

  var jr = d3.select('#judge_race')
  var jg = d3.select('#judge_gender')
  var jpa = d3.select('#appointed_by')
  var dr = d3.select('#def_race')
  var dg = d3.select('#def_gender')
  var vg = d3.select('#vic_gender')
  var mr = d3.select('#recruit')
  var tt = d3.select('#type')
  var rg = d3.select('#region')
  var yr = d3.select('#year')

  var jrCircle = d3.select('#circle_judge_race')
  var jgCircle = d3.select('#circle_judge_gender')
  var jpaCircle = d3.select('#circle_appointed_by')
  var drCircle = d3.select('#circle_def_race')
  var dgCircle = d3.select('#circle_def_gender')
  var vgCircle = d3.select('#circle_vic_gender')
  var mrCircle = d3.select('#circle_recruit')
  var ttCircle = d3.select('#circle_type')
  var rgCircle = d3.select('#circle_region')
  var yrCircle = d3.select('#circle_year')

  var options = [jr, jg, jpa, dr, dg, vg, mr, tt, rg, yr]

  var optionCircles = [jrCircle, jgCircle, jpaCircle, drCircle,
                        dgCircle, vgCircle, mrCircle, ttCircle,
                        rgCircle, yrCircle]

  for (option of options) {
    option.on('click', function() {
      clickedID = this.id;
      for (c of optionCircles) {
        if (c._groups[0][0].id === 'circle_' + clickedID) {
          selectOption(c, clickedID)
        }
        else {unselectOption(c)}
      }

      var desc = d3.selectAll('.desc');
      var oval = d3.select('#oval');
      var explodeCircle = d3.select('#explode-button');

      explodeCircle.transition().duration(500).attr('cx', margin.left*3);
      oval.transition().duration(500).attr('fill', '#898989');
      desc.remove();
      drawSideChart(view='box');
      removePlots(method='update');
      drawChart(sortMethod = window.sorting, selectedVariable = window.selectedID, method='update');
      window.setTimeout('delayScatters(dataset)', 1);

    })
  }
}; //end update process



function removePlots(method) {
  //don't remove the x label if we're just sorting
  if (method === 'update') {
    var xLab = d3.select('#x-label')
    var footnotes = d3.selectAll('.variable-footnote')
    xLab.remove();
    footnotes.remove();
  };

  var boxplots = d3.selectAll('.plot')
  var hiddenBoxplots = d3.selectAll('.gone')
  var labs = d3.selectAll('.var-labels')
  var clippaths = d3.select('#chart-area')
  var dots = d3.selectAll('.dot')

  dots.remove();
  hiddenBoxplots.remove();
  boxplots.remove();
  labs.remove();
  clippaths.remove();
}; // end remove Plots




// //inspired by: http://mcaule.github.io/d3_exploding_boxplot/
function drawScatter(dataset, variable, category, catLength) {

  chart.selectAll('dot')
        .data(dataset)
        .enter()
        .filter(function(d) {return d[variable] == category & d.sentence <= 30})
        .append('circle')
        .attr('class', function(d) {return 'dot ' + 'dot' + d[variable]})
        .attr('opacity', 0)
        .attr('cx', yScale(15))
        .attr('cy', function(d, i) { //https://bl.ocks.org/duhaime/14c30df6b82d3f8094e5a51e5fff739a
          if (i%2 === 0) {
            return xScale(d[variable]) + xScale.bandwidth()/2
          }
          else {
           return xScale(d[variable]) + xScale.bandwidth()/2
          }
        })
        .attr('clip-path', 'url(#chart-area)')
        .transition()
        .duration(function(d, i) {
          if (i%4 === 0) {return 900 + Math.random()*100}
          else if (i%4 === 1) {return 1000 + Math.random()*100}
          else if (i%4 === 2) {return 1100 + Math.random()*100}
          else {return 1300 + Math.random()*100}
        })
        .ease(d3.easeBackOut)
        .attr('cx', function(d) {return yScale(d.sentence) + Math.random()*5})
        .attr('cy', function(d, i) {
          if (i%2 === 0) {
            return xScale(d[variable]) + xScale.bandwidth()/2 + Math.random() * chartHeight/(3*catLength)
          }
          else {
           return xScale(d[variable]) + xScale.bandwidth()/2 - Math.random() * chartHeight/(3*catLength)
          }
        })
        .attr('r', 3)
        .attr('opacity', 0.5)
        .attr('fill', function(d) {return colors[d[variable]][0]});
}; //end drawScatter



//https://stackoverflow.com/questions/17117712/how-to-know-if-all-javascript-object-values-are-true
function clickedTrue(obj) {
  for (var o in obj) {
    if(obj[o]) {return true}
  }
  return false;
} //end clickedTrue



function delayScatters(dataset) {

  var labels = d3.selectAll('.var-labels')
  var categories = d3.selectAll('.var-labels')._groups[0]
  var catLength = categories.length;
  var plots = d3.selectAll('.plot')

  //array to keep track of which plot has been clicked
  var clicked = {};
  for (i = 0; i < catLength; i++) {
    var varID = categories[i].id;
    var varNum = varID.substr(-1);
    clicked[varNum] = false;
  }




  //explode plots one at at time
  labels.on('click', function() {

    var plotID = this.id;
    var plotNum = parseFloat(plotID.substr(plotID.length - 1));
    var box = d3.select('#plot' + plotNum);
    var desc = d3.selectAll('.desc');
    var tools = d3.selectAll('.tools')

    if (!clicked[plotNum]) {
      drawScatter(dataset, window.selectedID, plotNum, catLength);
      box.transition().duration(800).attr('opacity', 0);
      box.on('mouseover', function(){}) //hide tooltips
      clicked[plotNum] = true;
    }

    else if (clicked[plotNum]) {
      var scatters = d3.selectAll('.dot' + plotNum);

      scatters.attr('clip-path', 'url(#chart-area)').transition()
              .duration(function(d, i) {
                if (i%6 === 0) {return 600 + Math.random()*100}
                else if (i%5 === 0) {return 900 + Math.random()*100}
                else if (i%4 === 0) {return 1200 + Math.random()*100}
                else if (i%3 === 0) {return 1500 + Math.random()*100}
                else if (i%2 === 0) {return 1800 + Math.random()*100}
                else {return 2100 + Math.random()*100}
              })
              .attr('cx', -10)
              .attr('opacity', 0)
              .remove();
      box.transition().duration(1300).attr('opacity', 1);
      tooltips();
      clicked[plotNum] = false;
    }

    //change chart diagram if necessary
    if (clickedTrue(clicked)) {
          desc.remove();
          drawSideChart(view='dots');
    }

    else {
          desc.remove();
          drawSideChart(view='box');
          explodeCircle.transition().duration(500).attr('cx', margin.left*3);
          var oval = d3.select('#oval');
          oval.transition().duration(500).attr('fill', '#898989');

    }
  }) //end categories.on


  //explode all
  var explodeButton = d3.selectAll('#explode-button, #oval');
  var explodeCircle = d3.select('#explode-button');
  var explodeClicked = false;

  explodeButton.on('click', function() {
    var box = d3.selectAll('.plot');
    var desc = d3.selectAll('.desc');
    var oval = d3.select('#oval');

    if (!explodeClicked) {
      explodeCircle.transition().duration(500).attr('cx', margin.left*3.32)
      oval.transition().duration(500).attr('fill', 'black')
      for (cat in clicked) {
        if (!clicked[cat]) {
          desc.remove();
          drawSideChart(view='dots');
          box.transition().duration(800).attr('opacity', 0);
          drawScatter(dataset, window.selectedID, cat, catLength);
          clicked[cat] = true;
        } //end if
      } //end for
      explodeClicked = true;

    } //end if

    else if (explodeClicked) {
      explodeCircle.transition().duration(500).attr('cx', margin.left*3);
      oval.transition().duration(500).attr('fill', '#898989');
      for (cat in clicked) {
        if (clicked[cat]) {
          desc.remove();
          drawSideChart(view='box');
          box.transition().duration(1300).attr('opacity', 1);
          var scatters = d3.selectAll('.dot');
          scatters.attr('clip-path', 'url(#chart-area)')
                  .transition()
                  .duration(function(d, i) {
                      if (i%6 === 0) {return 600 + Math.random()*100}
                      else if (i%5 === 0) {return 900 + Math.random()*100}
                      else if (i%4 === 0) {return 1200 + Math.random()*100}
                      else if (i%3 === 0) {return 1500 + Math.random()*100}
                      else if (i%2 === 0) {return 1800 + Math.random()*100}
                      else {return 2100 + Math.random()*100}
                  })
                  .attr('cx', -10)
                  .attr('opacity', 0)
                  .remove();
          clicked[cat] = false;
        } //end if
      } //end for
      explodeClicked = false;

    } //end else if
  }) //end explodeButton.on

} //end delayScatters
