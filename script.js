document.addEventListener('DOMContentLoaded', function() {
    let dataPoints = [];
    let centroids = [];
    let clusters = {};
    let numClusters = 3; // Default value
    let svg = d3.select('#plot');
    let width = +svg.attr('width');
    let height = +svg.attr('height');

    // Scale functions
    let xScale = d3.scaleLinear().domain([-3, 3]).range([0, width]);
    let yScale = d3.scaleLinear().domain([-3, 3]).range([height, 0]);

    // Generate initial dataset
    fetch('/generate', {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            dataPoints = data.data;
            drawDataPoints();
        });

    function drawDataPoints() {
        svg.selectAll('circle.data-point').remove();
        svg.selectAll('circle.data-point')
            .data(dataPoints)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d[0]))
            .attr('cy', d => yScale(d[1]))
            .attr('r', 3)
            .attr('fill', 'steelblue');
    }

    function drawCentroids() {
        svg.selectAll('circle.centroid').remove();
        svg.selectAll('circle.centroid')
            .data(centroids)
            .enter()
            .append('circle')
            .attr('class', 'centroid')
            .attr('cx', d => xScale(d[0]))
            .attr('cy', d => yScale(d[1]))
            .attr('r', 8)
            .attr('fill', 'red');
    }

    // Update the number of clusters when the input changes
    document.getElementById('num-clusters').addEventListener('change', function() {
        numClusters = parseInt(this.value);
        centroids = [];
        clusters = {};
        drawCentroids();
        updateVisualization();
    });

    // Event listeners
    document.getElementById('generate-data').addEventListener('click', function() {
        fetch('/generate', {method: 'POST'})
            .then(response => response.json())
            .then(data => {
                dataPoints = data.data;
                centroids = [];
                clusters = {};
                drawDataPoints();
                drawCentroids();
                updateVisualization();
            });
    });

    document.getElementById('initialize').addEventListener('click', function() {
        let method = document.getElementById('init-method').value;
        if (method !== 'manual') {
            fetch('/initialize', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    method: method,
                    num_clusters: numClusters
                })
            })
            .then(response => response.json())
            .then(data => {
                centroids = data.centroids;
                drawCentroids();
            });
        } else {
            centroids = [];
            clusters = {};
            drawCentroids();
            svg.on('click', function(event) {
                if (centroids.length < numClusters) {
                    let coords = d3.pointer(event);
                    let x = xScale.invert(coords[0]);
                    let y = yScale.invert(coords[1]);
                    centroids.push([x, y]);
                    drawCentroids();
                }
            });
        }
    });

    document.getElementById('step').addEventListener('click', function() {
        fetch('/step', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                centroids: centroids,
                num_clusters: numClusters
            })
        })
        .then(response => response.json())
        .then(data => {
            centroids = data.new_centroids;
            clusters = data.clusters;
            updateVisualization();
        });
    });

    function updateVisualization() {

        let colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(d3.range(numClusters));

        console.log('Updating Visualization with clusters:', clusters);


        let clusterAssignments = {};
        for (let cluster in clusters) {
            clusters[cluster].forEach(index => {
                clusterAssignments[index] = cluster;
            });
        }

        console.log('Cluster Assignments:', clusterAssignments);


        svg.selectAll('circle.data-point')
            .data(dataPoints)
            .attr('fill', function(d, i) {
                let cluster = clusterAssignments[i];
                if (cluster !== undefined) {
                    return colorScale(cluster);
                } else {
                    return 'steelblue';
                }
            })
            .style('fill', function(d, i) {
                let cluster = clusterAssignments[i];
                return cluster !== undefined ? colorScale(cluster) : 'steelblue';
            });




        drawCentroids();
    }





    document.getElementById('run').addEventListener('click', function() {
        function step() {
            fetch('/step', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    centroids: centroids,
                    num_clusters: numClusters
                })
            })
            .then(response => response.json())
            .then(data => {
                let oldCentroids = JSON.stringify(centroids);
                centroids = data.new_centroids;
                clusters = data.clusters;
                updateVisualization();
                if (oldCentroids !== JSON.stringify(centroids)) {
                    setTimeout(step, 500); // Continue stepping
                }
            });
        }
        step();
    });

    document.getElementById('reset').addEventListener('click', function() {
        centroids = [];
        clusters = {};
        drawDataPoints();
        drawCentroids();
        updateVisualization();
    });
});
