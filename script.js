//Fetch the data
Promise.all([
    fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json')
]).then(function (responses) {
    //Executes at the end of each fetch
    return Promise.all(responses.map(function (response) {
        return response.json();
    }));
}).then(function (data) {
    //Executes when both fetches are finished
    buildGraph(data[0])
}).catch(function (error) {
    if (error) throw error;
});

//Builds the visualization
const buildGraph = (movieData) => {

    //Create the scale for the colors
    //Get all the genre categories
    const genre = movieData.children.map((d) => d.name)
    //Create a linear scale for the colors representation
    //The index of the genre is used for this mapping
    const colorScale = d3.scaleLinear()
        .domain([0, genre.length - 1])
        .range(["black", "#00ff00"])

    //Create the svg width w and height h, padding to be use later
    const w = 1000;
    const h = 600;
    const w_padding = 20;
    const h_padding = 20;
    const svg = d3.select("#plot")
        .append("svg")
        .attr("height", h)
        .attr("width", w)

    //Create an svg for the legend width wLeg and height hLeg with padding (used later)
    const wLeg = 720;
    const hLeg = 40;
    const wLegPadding = 10;
    const hLegPadding = 10;
    //Spacing between the individual legend items
    const spacingLeg = 100;
    const svgLegend = d3.select("#legend")
        .append("svg")
        .attr("height", hLeg)
        .attr("width", wLeg);

    //Place svg groups inside the legend for each genre
    const legBox = svgLegend.selectAll("g")
        .data(genre)
        .enter()
        .append("g")
        //Transform the group to its position 
        .attr("transform", (_, i) => "translate(" + (wLegPadding + i * spacingLeg) + ", " + hLegPadding + ")")

    //Place svg groups inside the legend for each genre
    legBox.append("rect")
        .attr("class", "legend-item")
        .attr("width", 20)
        .attr("height", 20)
        .attr("stroke", "#00ff00")
        //Fill color is based on the genre's index
        .attr("fill", (d, i) => colorScale(i))
    //Place text elements in the legend
    legBox.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .attr("stroke", "#00ff00")
        .attr("fill", "#00ff00")
        .text(d => d)

    //Tooltip div
    let div = d3.select("#plot")
        .append("div")
        .attr("id", "tooltip")
        //Hide this div on initialization
        .style("opacity", 0);

    //Create the d3 data structures for this visualization
    //Set up the tree map size
    const treemap = d3.treemap().size([w - w_padding, h - h_padding]);
    //Set up the hierarchy data structure
    const hierarchy = d3.hierarchy(movieData, (d) => d.children)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value)
    //Associate the tree map with the hierarchy
    const tree = treemap(hierarchy);

    //Create svg groups based on the data in the hierarchy i.e. tree.leaves()
    const box = svg.selectAll("g")
        .data(tree.leaves())
        .enter()
        .append("g")
        //Transform the groups to the correct locations
        .attr("transform", (d) => "translate(" + d.x0 + "," + d.y0 + ")")

    //For each svg group append a svg rect
    box.append("rect")
        .attr("class", "tile")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        //Color the rect based on genre index
        .attr("fill", (d) => colorScale(genre.indexOf(d.data.category)))
        //Set the properties required by the spec and used in the tooltip
        .attr("data-name", (d) => d.data.name)
        .attr("data-category", (d) => d.data.category)
        .attr("data-value", (d) => d.data.value)
        .attr("stroke", "#00ff00")
        //Tooltip event mouseover rect
        .on("mouseover", (d) => {
            //Change the opacity to render the tooltip div
            div.transition()
                .duration(300)
                .style("opacity", 1);
            //Set the html text of the tooltip
            div.html(
                //Access information in the targets dataset
                `Name: ${d.target.dataset.name}<br>
        Genre: ${d.target.dataset.category}<br>
        Sales: ${d.target.dataset.value}`)
                //Add properties (by spec)
                .attr("data-value", d.target.dataset.value)
                //Transform the div to pointer location
                .style("left", (d.pageX + 10) + "px")
                .style("top", (d.pageY) + "px")
        })
        //Tooltip event mouseout rect
        .on("mouseout", function (d) {
            //Change the opacity to render the tooltip div away
            div.transition()
                .duration(100)
                .style("opacity", 0)
        })

    //For each svg group append a svg text
    box.append("text")
        //Color the text, by shifting the genre index by 3
        .attr("fill", (d) => colorScale((genre.indexOf(d.data.category) + 3) % (genre.length - 1)))
        //For each text create a tspan
        .selectAll("tspan")
        //The data for the tspan. pass down the rect height and width. 
        //This will be used to trim the text when it gets too long.
        .data(d => {
            //Split the text to put one word on a line
            return d.data.name.split(/\s+/g).map(elm => {
                return { text: elm, width: (d.x1 - d.x0), height: (d.y1 - d.y0) }
            })
        })
        .join("tspan")
        //Position the word vertically in the svg group
        .attr("y", (d, i) => 15 + (i * 12))
        //Position the text 3px off the right boundary of the svg group
        .attr("x", 3)
        //Cut the text short when it starts bleeding out the rect
        .text((d, i, j) => {
            return i < (d.height / 12 - 1)
                ? d.text : ""
        })
}