console.log('loaded app.js');


// ======================================================
// TA Benji taught me a cool way to only call my data once
//  by creating a function for it. TA Benji did most of the writing
// of this while teaching me how to do this.

var getData = (() => {
    var _state = 'no data';
    var _data;
    var _callbackQueue = [];
    return function (callback) {
        //first time called
        switch (_state) {
            case 'no data':
                _callbackQueue.push(callback);
                _state = 'waiting';

                //handling what happens when data gets back
                d3.json('samples.json').then(data => {
                    for (var i = 0; i < _callbackQueue.length; i++)
                        _callbackQueue[i](data);
                    _state = 'complete';
                    _data = data;
                });
                break;

            //subsequent times, but data hasn't returned yet
            case 'waiting':
                _callbackQueue.push(callback);
                break;

            case 'complete':
                callback(_data);
                break;
        }
    }
})();
// =====================================================================

// Function for plotting Bargraph
function barGraph(patientId) {
    getData((importedData) => {
        // pulling out patient sample data
        samples = importedData.samples;
        sample = samples.filter(o => o.id === patientId);
        // console.log('sample');
        // console.log(sample);

        // getting arrays of the data for plotting
        // this is for the y axis (since this vertical)
        otuIds = sample[0].otu_ids;
        // console.log(otuIds);

        // this is for the x axis
        sampleValues = sample[0].sample_values;
        // console.log(sampleValues);

        // this is for the hover text
        otuLabels = sample[0].otu_labels;


        // This makes a String out of the number Otu for the ticks
        var otuIdsSlice = otuIds.slice(0, 10).reverse();
        var otuIdsSliceStr = [];
        // adding OTU to labels
        for (i = 0; i < otuIdsSlice.length; i++) {
            otuIdsSliceStr[i] = `OTU ${otuIdsSlice[i]}`;
        }

        var traceBar = {
            // I want only the first tenn (top) and i them in descenting order
            y: otuIdsSliceStr,
            x: sampleValues.slice(0, 10).reverse(),
            text: otuLabels.slice(0, 10).reverse(),
            type: 'bar',
            orientation: 'h'
        };

        var data = [traceBar];

        var layout = {
            // title: `Patient ${patientId}'s Belly Button Bacteria`
        };

        Plotly.newPlot('bar', data, layout);
    });
}

function bubbleGraph(patientId) {
    console.log(`Patient is ${patientId}`);
    getData((importedData) => {
        // pulling out patient sample data
        samples = importedData.samples;
        sample = samples.filter(o => o.id === patientId);

        // for x values and colors
        otuIds = sample[0].otu_ids;
        // console.log(otuIds);

        // y values and size
        sampleValues = sample[0].sample_values;
        // console.log(sampleValues);

        // this is for the hover text
        otuLabels = sample[0].otu_labels;


        var traceBubble = {
            x: otuIds,
            y: sampleValues,
            text: otuLabels,
            mode: 'markers',
            marker: {
                color: otuIds,
                size: sampleValues
            }
        };

        var data = [traceBubble];

        var layout = {
            // title: `Patient ${patientId}'s Bacteria Breakdown`
        };

        Plotly.newPlot('bubble', data, layout);
    });
}

function demographicInfo(patientId) {
    console.log(`Patient is ${patientId}`);

    // selecting panel to put demographic metadata in
    var demoPanel = d3.select('.panel-body');

    getData((importedData) => {
        // pulling out patient sample data
        metadatas = importedData.metadata;
        // console.log(metadatas);
        metadata = metadatas.filter(o => parseInt(o.id) === parseInt(patientId))[0];
        // console.log(metadata);

        // string for putting into demographics table
        var htmlString = '';
        // iterating over key and value and printing out
        Object.entries(metadata).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);

            // place holder string to put into htmlString
            var string = `<p>${key}: ${value}</p>`;

            // combining into one long string to pass into demoPanel
            htmlString = htmlString + string;

        });

        // putting demographic metadata into panel
        demoPanel.html(htmlString);


    });
}


function gaugePlot(patientId) {
    getData((importedData) => {
        // pulling out patient sample data
        metadatas = importedData.metadata;
        metadata = metadatas.filter(o => parseInt(o.id) === parseInt(patientId))[0];
        // console.log(metadata);

        // getting belly button wash frequency from patient meta data
        var washFreq = metadata.wfreq;
        console.log(washFreq);

        // got the template for the gauge plot here
        // https://plotly.com/javascript/gauge-charts/#custom-gauge-chart
        // and my color palette here
        // https://coolors.co/gradient-palette/77b773-d1d8d7?number=9
        var traceGauge = {
            domain: { x: [0, 1], y: [0, 1] },
            value: washFreq,
            // where i got the code to make subtitle in text field
            // https://plotly.com/javascript/indicator/
            title: { text: "Belly Button Washing Frequency<br><span style='font-size:1em;color:gray'>Scrubs Per Week<span>" },
            type: 'indicator',
            mode: 'gauge+number',
            gauge: {
                axis: { range: [0, 9] },
                steps: [
                    { range: [0, 1], color: '#D1D8D7' },
                    { range: [1, 2], color: '#C6D4CB' },
                    { range: [2, 3], color: '#BBD0BE' },
                    { range: [3, 4], color: '#AFCCB2' },
                    { range: [4, 5], color: '#A4C8A5' },
                    { range: [5, 6], color: '#99C399' },
                    { range: [6, 7], color: '#8EBF8C' },
                    { range: [7, 8], color: '#82BB80' },
                    { range: [8, 9], color: '#77B773' }
                ]
            }
        };


        var data = [traceGauge];

        var layout = {
            // title: 'Belly Button Washing Frequency'
        };

        Plotly.newPlot('gauge', data, layout);


    });
}



// got help of this from dom's talk on homework
// this is the event handler
function optionChanged(patientId) {
    console.log(`Current Patient is ${patientId}`);
    // console.log('replot');

    // these for lines remake the graphs for newly selected patient
    barGraph(patientId);
    bubbleGraph(patientId);
    demographicInfo(patientId);
    gaugePlot(patientId);
}

function init() {

    var selection = d3.select('#selDataset');

    getData((importedData) => {
        console.log(importedData);

        var patientNames = importedData.names;

        // this part I got from Dom's talk on this homework
        // this puts patient names in dropdown
        patientNames.forEach(patient => {
            selection.append('option')
                .text(patient)
                .property('value', patient);
        });





        // starting by plotting just patient zero
        console.log(importedData.names[0]);

        // picking a patient to work with
        var patientZero = importedData.names[0];

        console.log('original plot');

        // these for lines make the initial graphs
        barGraph(patientZero);
        bubbleGraph(patientZero);
        demographicInfo(patientZero);
        gaugePlot(patientZero);



    });
}

// this calls the initial function
init();
