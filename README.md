# Animated Big Data Visualization

> Animated Visualization of Frequent Itemsets as Hypergraphs

If you simply want to view the resulting visualization, you can check out the results 
[here](https://deniaz.github.io/animated-big-data).

## Build
If you want to play around with the graph's implementation and build the dist-file you need to have 
[Node.js](https://nodejs.org/en/) and [gulp.js](http://gulpjs.com/) installed. The build-task is defined as the 
default task, so you can simply run `gulp` from your shell of choice in the project's directory and you're good to go.

The version number for the dist-file is taken from `package.json`.

## Background
This Proof Of Concept was developed as part of a student research paper at [HSR](https://www.hsr.ch) in 2015.

The visualization of Big Data is a non-trivial affair. As the type of data and information about it are not known in 
advance, it is complex to find a suitable and optimal visualization technique. In Prof. Dr. Eduard Glatz's paper 
[Visualizing big network traffic data using frequent pattern  mining and hypergraphs](http://link.springer.com/article/10.1007%2Fs00607-013-0282-8)
it was shown, that through Data Mining calculated Frequent Itemsets can efficiently be displayed as a hypergraph with 
different vertices. Although hypergraphs might no be the most suitable visualization technique in all cases, they provide 
a generic and flexible solution.

In this student research project various layout algorithms were developed and tested in a experimental manner, which are 
suited for changes over time. Thereby are some of the most important factors overlapping of nodes and links and similar 
problems. These problems were also considered and attended to in the student research project.

The result was a layout algorithm which displays a structured hypergraph in a browser and represents the chronological 
dimension with animated toggling of visibility. Due to the use of web technologies a user can interact with the hypergraph 
and its animation, e.g. controlling the time interval. Furthermore related concepts where examined and documented, such as 
various layout algorithms and alternative, interactive visualization techniques.

## License
[MIT License](http://opensource.org/licenses/MIT)