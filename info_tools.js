//This script initializes events for the toolbar on the left side of the page.
//TODO: Pause/play
function convertTime(num){
    if(num == 0){
        return "12am";
    }

    if(num == 12){
        return "12pm";
    }

    if(num % 3 == 0 && num < 12){
        return num;
    }

    if(num % 3 == 0 && num > 12){
        return num-12;
    }

    if(num == 23){
        return 11;
    }

    return "";
}

$("document").ready(function(){
    //Event listeners
    $(".filter").on("click", function(event){
        event.stopPropagation();
        var dropdown = $(event.target).closest(".filter").children(".dropdown");
        if(dropdown.css("display") == "none"){
            dropdown.slideDown("slow");
            $(event.target).closest(".filter").children(".name").children("img").attr("src", "images/up.png");
        }else if($(event.target).closest(".name").length > 0){
            $(event.target).closest(".filter").children(".name").children("img").attr("src", "images/down.png");
            dropdown.slideUp("slow");
        }
    });

    $(".searchbar").on("click", function(event){
        if($(".searchbar").attr("value") == "Enter a place..."){
            $(".searchbar").attr("value", "");
        }
    });

    //Create interactive tools

    //Pause/Play
    $(".pause").on("click", function(){
        $(".pause").css("display", "none");
        $(".play").css("display", "inline");
        clearTimeout(timeout);
    });

    $(".play").on("click", function(){
        $(".pause").css("display", "inline");
        $(".play").css("display", "none");
        doHour();
    });

    //Speed slider
    var timedrag = false;

    barwidth = $("#speed-bar").width();

    drawClocks();

    var tooltip= d3.select("body")
                    .append("div")
                    .attr("class", "tooltip");

    $(".slider").draggable({ axis: "x", containment: "#speed-bar" });
    $(".slider").on("mousedown", function(event){
        $(document).on("mouseup", function(event){
            sliderpos = $(".slider").position().left;
            $(document).off("mouseup");
        });
    });

    //Date picker
    $(".datepicker").datepicker({ minDate: new Date("January 1, 2015"), maxDate: new Date("June 30, 2015"), defaultDate: new Date("January 1, 2015"),
        onSelect: function(dateText, inst){
            clockStarted = false;

            var newdate = dateText.split("/");
            time = new Date(parseInt(newdate[2]), parseInt(newdate[0])-1, parseInt(newdate[1]), 0, 0, 0);
            time.setTime(time.getTime() - 60*60*1000);
            loadDate = new Date(parseInt(newdate[2]), parseInt(newdate[0])-1, parseInt(newdate[1]), 0, 0, 0);

            stored = [];
            clearTimeout(timeout);
            loadDayJSON();
        }});

    //Circle changer
    $(".choice").on("click", changeChoice);

    //Default value
    sliderpos = 147;
    /*functions*/

    function drawClocks(){
        //Clocks are circles drawn in 12 pieces with a line between each piece
        //In this stage both clocks are treated as identical
        var radius = 55;
        var amoffset = radius;
        var pmoffset = radius*2 + 25;

        var am = d3.select(".am-clock svg");
        var pm = d3.select(".pm-clock svg");
        for(var i = -3; i < 9; i++){
            var startradians = i*360/12 * Math.PI / 180;
            var endradians = (i+1)*360/12 * Math.PI / 180;

            var startx = radius*Math.cos(startradians) + radius;
            var starty = radius*Math.sin(startradians) + radius;
            var endx = radius*Math.cos(endradians) + radius;
            var endy = radius*Math.sin(endradians) + radius;

            path = "M55,55 ";
            path += "L"+startx+","+starty+" ";
            path += "A55,55 0 0,1 "+endx+","+endy+" ";

            am.append("path")
                .attr("d", path)
                .style("fill", "#dddddd")
                .attr("stroke", "#666666")
                .attr("on", "true")
                .attr("class", "am "+(i+3)+" hour")
                .on("mousemove", showTooltip)
                .on("mouseout", hideTooltip)
                .on("click", toggleHour);

            pm.append("path")
                .attr("d", path)
                .style("fill", "#dddddd")
                .attr("stroke", "#666666")
                .attr("on", "true")
                .attr("class", "pm "+(i+15)+" hour")
                .on("mousemove", showTooltip)
                .on("mouseout", hideTooltip)
                .on("click", toggleHour);
        }
    }

    function showTooltip(){
        var starthour = parseInt(d3.select(d3.event.target).attr("class").split(" ")[1]);
        var endhour = starthour + 1;
        if(starthour == 0){
            starthour = 12;
        }
        var text;
        if(d3.select(d3.event.target).classed("am")){
            text = starthour+"am - "+endhour;
            if(endhour == 12){
                text += "pm";
            }else{
                text += "am";
            }
        }else{
            text = starthour+"pm - "+endhour;
            if(endhour == 12){
                text += "am";
            }else{
                text += "pm";
            }
        }

        if(d3.select(d3.event.target).attr("on") == "true"){
            tooltip.style("background", "#222222");
            tooltip.style("color", "#dddddd");
            tooltip.style("font-weight", "normal");
        }else{
            tooltip.style("background", "#dddddd");
            tooltip.style("color", "#222222");
            tooltip.style("font-weight", "bold");
        }

        console.log(d3.event.pageX + 5);
        tooltip
            .style("left", d3.event.pageX+5+"px")
            .style("top", d3.event.pageY-8+"px")
            .style("display", "block")
            .text(text);
    }

    function hideTooltip(){
        tooltip.style("display", "none");
    }

    function toggleHour(){
        var hour = d3.select(d3.event.target);
        var newval, newback, newstroke;
        if(hour.attr("on") == "true"){
            newval = "false";
            newback = "#222222";
            newstroke = "#dddddd";
        }else{
            newval = "true";
            newback = "#dddddd";
            newstroke = "#666666";
        }

        hour.attr("on", newval);
        hour.transition().duration(250)
                .style("fill", newback)
                .style("stroke", newstroke);
    }

    function changeChoice(event){
        $(event.target).parent().children(".choice[filter='true']").attr("filter", "false");
        $(event.target).attr("filter", "true");
    }
});
