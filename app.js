'use strict';
const _ = require('lodash');
const express = require('express');
const app = express();
const addRequestId = require('express-request-id')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const config = require('./config');
const async = require('async');
const fs = require('fs');

app.use(addRequestId);
app.use(bodyParser.json({
    limit: '1mb'
}));
// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Pass to next layer of middleware
    next();
});

app.use('/tree', function(req, res, next) {
   // console.log(JSON.stringify(req.body, null, 2))
    let toLargeInput = req.body.length > 200;
    if (toLargeInput) {
        res.status(422).json({'error': 'Input exceeds maximum of 200 sequences'});
    } else {
        next();
    }
});

app.post('/tree', function(req, res) {
    let filename =  req.id + '.fasta';

    try {
        jobQueue.push({filename: filename, req_id: req.id,  sequences: req.body}, function(err, fileName) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                fs.readFile(fileName + '.fasta.tree', "utf8", function(err, data) {
                    if (err) {
                        res.sendStatus(500)
                        console.log('No tree file found. Malformed data? Removing ' + fileName + '.fasta');

                        console.log(err)
                        fs.unlink(fileName + '.fasta', function(e1) {
                            if (e1) {
                                console.log('Failed to remove file: ' + fileName + '.fasta');
                            }
                        }); 
                       
                    } else {
                        const newick = data.replace(/\d+_BOLD_/g, 'BOLD%3A').replace(/\n/g, '').replace(/\d+_/g, '').replace(/_/g, ' '); // Remove mafft formatting and new lines

                        res.status(200).json({newick: newick});
                        fs.unlink(fileName + '.fasta.tree', function(e1) {
                            if (e1) {
                                console.log('Failed to remove file: ' + fileName + '.fasta.tree');
                            }
                        }); 
                        fs.unlink(fileName + '.fasta', function(e2) {
                            if (e2) {
                                console.log('Failed to remove file: ' + fileName + '.fasta');
                            }
                        }); 
                    }
                });
            }
        });
    } catch (err) {
        console.log(err);
    }
});

const toFasta = (sequences) => sequences.map(s => `>${s.scientificName}\n${s.sequence}`).join('\n');

let jobQueue = async.queue(function(options, callback) {
    try{
        const fasta = toFasta(options.sequences);
    fs.writeFile(config.INPUT_PATH + options.filename, fasta, 'utf-8', function(e) {
        if (e) {
            console.log(e)
            callback(e, null);
        } else {
                let pcs = spawn('mafft',
                [ `--retree`, 2,
                `--maxiterate`, 2,
                 `--localpair`,
                 `--reorder`,
                 `--treeout`, 
                 `${config.INPUT_PATH + options.filename}`,
                ],
                {stdio: ['ignore', 'ignore', 'pipe']});
            
            pcs.on('error',
                function(e) {
                    console.log("Error on mafft")
                    console.log(e);
                    callback(e, null);
                    
                });
            pcs.on('close',
            function(){
                callback(null, config.INPUT_PATH + options.req_id );
            })
        }
    });
} catch(err){
    callback(err, null)
}
}, config.NUM_CONCURRENT_PROCESSES);

http.listen(config.EXPRESS_PORT, function() {
    console.log("Config "+config.INPUT_PATH )
    console.log('Express server listening on port ' + config.EXPRESS_PORT);
});