function createBubbleChart(error, projects, languageNames) {

  var stars = projects.map(function(project) { return +project.Stars; });
  var meanStars = d3.mean(stars),
      starExtent = d3.extent(stars),
      starScaleX,
      starScaleY;

  var languages = d3.set(projects.map(function(project) { return project.Language; }));
  var languageColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(languages.values());


  var width = 1200,
      height = 800;
  var svg,
      circles,
      circleSize = { min: 8, max: 30 };
  var circleRadiusScale = d3.scaleSqrt()
    .domain(starExtent)
    .range([circleSize.min, circleSize.max]);

  var forces,
      forceSimulation;

  createSVG();
  toggleLanguageKey(!populationGrouping());
  createCircles();
  createForces();
  createForceSimulation();
  //addFlagDefinitions();
  addFillListener();
  addGroupingListeners();

  function createSVG() {
    svg = d3.select("#bubble-chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height);
  }

  function toggleLanguageKey(showLanguageKey) {
    var keyElementWidth = 150,
        keyElementHeight = 30;
    var onScreenYOffset = keyElementHeight*1.5,
        offScreenYOffset = 100;

    if (d3.select(".language-key").empty()) {
      createLanguageKey();
    }
    var languageKey = d3.select(".language-key");

    if (showLanguageKey) {
      translateLanguageKey("translate(0," + (height - onScreenYOffset) + ")");
    } else {
      translateLanguageKey("translate(0," + (height + offScreenYOffset) + ")");
    }

    function createLanguageKey() {
      var keyWidth = keyElementWidth * languages.values().length;
      var languageKeyScale = d3.scaleBand()
        .domain(languages.values())
        .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);

      svg.append("g")
        .attr("class", "language-key")
        .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
        .selectAll("g")
        .data(languages.values())
        .enter()
          .append("g")
            .attr("class", "language-key-element");

      d3.selectAll("g.language-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", function(d) { return languageKeyScale(d); })
          .attr("fill", function(d) { return languageColorScale(d); });

      d3.selectAll("g.language-key-element")
        .append("text")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return languageKeyScale(d) + keyElementWidth/2; })
          .text(function(d) { return languageNames[d]; });


      // The text BBox has non-zero values only after rendering
      d3.selectAll("g.language-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            // The BBox.height property includes some extra height we need to remove
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }

    function translateLanguageKey(translation) {
      languageKey
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

  // function flagFill() {
  //   return isChecked("#flags");
  // }

  function isChecked(elementID) {
    return d3.select(elementID).property("checked");
  }

  function createCircles() {
    var formatStar = d3.format(",");
    circles = svg.selectAll("circle")
      .data(projects)
      .enter()
        .append("a")
        .attr("xlink:href", function (d) {
            return d.URL;
        })
        .attr("target", "_blank")
        .append("circle")
        .attr("r", function(d) { return circleRadiusScale(d.Stars); })
        .on("mouseover", function(d) {
          updateCountryInfo(d);
        })
        .on("mouseout", function(d) {
          updateCountryInfo();
        });
    updateCircles();

    function updateCountryInfo(project) {
      var info = "";
      if (project) {
        info = project.Name + ": " + project.Description + " Stars: " + formatStar(project.Stars);
      }
      d3.select("#project-info").html(info);
    }
  }

  function updateCircles() {
      circles
      .attr("fill", function(d) {
        return languageColorScale(d.Language);
      });
  }

  function createForces() {
    var forceStrength = 0.05;

    forces = {
      combine:        createCombineForces(),
      // countryCenters: createCountryCenterForces(),
      continent:      createContinentForces(),
      population:     createStarForces()
    };

    function createCombineForces() {
      return {
        x: d3.forceX(width / 2).strength(forceStrength),
        y: d3.forceY(height / 2).strength(forceStrength)
      };
    }

    // function createCountryCenterForces() {
    //   var projectionStretchY = 0.25,
    //       projectionMargin = circleSize.max,
    //       projection = d3.geoEquirectangular()
    //         .scale((width / 2 - projectionMargin) / Math.PI)
    //         .translate([width / 2, height * (1 - projectionStretchY) / 2]);
    //
    //   return {
    //     x: d3.forceX(function(d) {
    //         return projection([d.CenterLongitude, d.CenterLatitude])[0];
    //       }).strength(forceStrength),
    //     y: d3.forceY(function(d) {
    //         return projection([d.CenterLongitude, d.CenterLatitude])[1] * (1 + projectionStretchY);
    //       }).strength(forceStrength)
    //   };
    // }

    function createContinentForces() {
      return {
        x: d3.forceX(continentForceX).strength(forceStrength),
        y: d3.forceY(continentForceY).strength(forceStrength)
      };

      function continentForceX(d) {
        // if (d.Language === 'python' || d.Language === 'java' || d.Language === 'unknown')
        //     return 600;
        // else if (d.Language === 'javascript' || d.Language === 'html')
        //     return 345;
        // else
        //     return 855;


        if (d.Language === 'python')
          return 600;
        else if (d.Language === 'java')
          return 600;
        else if (d.Language === 'unknown')
          return 600;
        else if (d.Language === 'javascript')
          return 250;
        else if (d.Language === 'html')
          return 250;
        else if (d.Language == 'go')
          return 900;
        else
          return 900;

      }

      function continentForceY(d) {
        if (d.Language === 'python')
          return 400;
        else if (d.Language === 'java')
          return 100;
        else if (d.Language === 'unknown')
          return 650;
        else if (d.Language === 'javascript' || d.Language === 'go')
          return 250;
        else if (d.Language === 'html' || d.Language === 'dart')
          return 550;
      }

    }

    function createStarForces() {
      var languageNamesDomain = languages.values().map(function(Language) {
        return languageNames[Language];
      });
      var scaledStarsMargin = circleSize.max;

      starScaleX = d3.scaleBand()
        .domain(languageNamesDomain)
        .range([scaledStarsMargin, width - scaledStarsMargin*2]);
      starScaleY = d3.scaleLog()
        .domain(starExtent)
        .range([height - scaledStarsMargin, scaledStarsMargin*2]);

      var centerCirclesInScaleBandOffset = starScaleX.bandwidth() / 2;
      return {
        x: d3.forceX(function(d) {
            return starScaleX(languageNames[d.Language]) + centerCirclesInScaleBandOffset;
          }).strength(forceStrength),
        y: d3.forceY(function(d) {
          return starScaleY(d.Stars)
        }).strength(forceStrength)
      };
    }

  }

  function createForceSimulation() {
    forceSimulation = d3.forceSimulation()
      .force("x", forces.combine.x)
      .force("y", forces.combine.y)
      .force("collide", d3.forceCollide(forceCollide));
    forceSimulation.nodes(projects)
      .on("tick", function() {
        circles
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });
  }

  function forceCollide(d) {
    // return countryCenterGrouping() || populationGrouping() ? 0 : circleRadiusScale(d.Stars) + 1;
    return countryCenterGrouping() ? 0 : circleRadiusScale(d.Stars) + 1;
  }

  function countryCenterGrouping() {
    return isChecked("#country-centers");
  }

  function combineGrouping() {
    return isChecked("#combine")
  }

  function populationGrouping() {
    return isChecked("#population");
  }

  // function addFlagDefinitions() {
  //   var defs = svg.append("defs");
  //   defs.selectAll(".flag")
  //     .data(countries)
  //     .enter()
  //       .append("pattern")
  //       .attr("id", function(d) { return d.CountryCode; })
  //       .attr("class", "flag")
  //       .attr("width", "100%")
  //       .attr("height", "100%")
  //       .attr("patternContentUnits", "objectBoundingBox")
  //         .append("image")
  //         .attr("width", 1)
  //         .attr("height", 1)
  //         // xMidYMid: center the image in the circle
  //         // slice: scale the image to fill the circle
  //         .attr("preserveAspectRatio", "xMidYMid slice")
  //         .attr("xlink:href", function(d) {
  //           return "flags/" + d.CountryCode + ".svg";
  //         });
  // }

  function addFillListener() {
    d3.selectAll('input[name="fill"]')
      .on("change", function() {
        toggleLanguageKey(!populationGrouping());
        updateCircles();
      });
  }

  function addGroupingListeners() {
    addListener("#combine",         forces.combine);
    addListener("#country-centers", forces.population);
    addListener("#continents",      forces.continent);
    addListener("#population",      forces.population);

    function sleep(delay) {
	//delay表示的毫秒数
  var start = (new Date()).getTime();
  while ((new Date()).getTime() - start < delay) {
    continue;
  }
  }


    function addListener(selector, forces) {
      d3.select(selector).on("click", function() {
        console.log(projects);
        forceSimulation.stop();
        if (combineGrouping())
        {
          for (var i = 0; i < projects.length; i++)
          {
            projects[i].x = NaN;
            projects[i].y = NaN;
          }
          createForces();
          createForceSimulation();

        }
        else
        {
          updateForces(forces);
        }
        toggleLanguageKey(!populationGrouping() && !countryCenterGrouping());
        togglePopulationAxes(populationGrouping() || countryCenterGrouping());
      });
    }

    function updateForces(forces) {
      forceSimulation
        .force("x", forces.x)
        .force("y", forces.y)
        .force("collide", d3.forceCollide(forceCollide))
        .alpha(0.5)
          .alphaDecay(0.002)
        .restart();
    }

    function togglePopulationAxes(showAxes) {
      var onScreenXOffset = 40,
          offScreenXOffset = -40;
      var onScreenYOffset = 20,
          offScreenYOffset = 100;

      if (d3.select(".x-axis").empty()) {
        createAxes();
      }
      var xAxis = d3.select(".x-axis"),
          yAxis = d3.select(".y-axis");

      if (showAxes) {
        translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
      } else {
        translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
      }

      function createAxes() {
        var numberOfTicks = 10,
            tickFormat = ".0s";

        var xAxis = d3.axisBottom(starScaleX)
          .ticks(numberOfTicks, tickFormat);

        svg.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
          .call(xAxis)
          .selectAll(".tick text")
            .attr("font-size", "16px");

        var yAxis = d3.axisLeft(starScaleY)
          .ticks(numberOfTicks, tickFormat);
        svg.append("g")
          .attr("class", "y-axis")
          .attr("transform", "translate(" + offScreenXOffset + ",0)")
          .call(yAxis);
      }

      function translateAxis(axis, translation) {
        axis
          .transition()
          .duration(500)
          .attr("transform", translation);
      }
    }
  }

}

function clearBubbleChart(){
  d3.select("svg").remove();
}
