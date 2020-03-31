var express = require("express");
var req = require('request');
// const fs = require('fs');
var async = require('async');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var csrf = require('csurf');
var app = express();
app.set('view engine', 'ejs');
// app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
var redisclient = require('redis').createClient(process.env.REDIS_URL || {
    host: '127.0.0.1',
    port: 6379
});
app.use(cookieParser());
app.use(csrf({
    cookie: true
}));


// let baseurl = 'https://www.geodesignhub.com/api/v1/projects/';  
let baseurl = 'http://local.test:8000/api/v1/projects/';


const image_files = ['commecial-office.jpg',
    'commercial-block-4.jpg',
    'commercial-fuel.jpg',
    'commercial-large-store.jpg',
    'commercial-mall.jpg',
    'commercial-office-3.jpg',
    'commercial-office-4.jpg',
    'commercial-office-6.jpg',
    'commercial-office-8.jpg',
    'commercial-office-9.jpg',
    'commercial-office-low-density.jpg',
    'commercial-offices-5.jpg',
    'commercial-offices-7.jpg',
    'commercial-offices-8.jpg',
    'commercial-restaurant.jpg',
    'commercial-shop-front.jpg',
    'commerical-entertainment.jpg',
    'commerical-low-density-2.jpg',
    'commerical-office-large.jpg',
    'commerical-shop.jpg',
    'fam-barn-2.jpg',
    'farm-barn.jpg',
    'farm-shed.jpg',
    'farm-windmill-2.jpg',
    'farm-windmill.jpg',
    'industiral-services.jpg',
    'industrial-factory-2.jpg',
    'industrial-factory-3.jpg',
    'industrial-factory-4.jpg',
    'industrial-factory-5.jpg',
    'industrial-factory-warehouse.jpg',
    'industrial-factory.jpg',
    'industrial-heavy-industry.jpg',
    'industrial-offices.jpg',
    'industrial-plant.jpg',
    'industrial-processing.jpg',
    'industrial-warehouse-2.jpg',
    'industrial-warehouse-3.jpg',
    'industrial-warehouse-4.jpg',
    'industrial-warehouse-5.jpg',
    'industrial-warehouse.jpg',
    'institutional-hospital-2.jpg',
    'institutional-hospital.jpg',
    'institutional-office-3.jpg',
    'institutional-uni-cityhall-2.jpg',
    'institutional-uni-cityhall.jpg',
    'mix-block.jpg',
    'mix-building.jpg',
    'mix-buildings-3.jpg',
    'mix-low-density.jpg',
    'mix-med-density.jpg',
    'mix-offices-2.jpg',
    'mix-offices-4.jpg',
    'mix-offices.jpg',
    'mix-restaurant-housing.jpg',
    'mix-tower-2.jpg',
    'mix-tower-3.jpg',
    'mix-tower-4.jpg',
    'residential-high-density-housing-3.jpg',
    'residential-high-density-housing.jpg',
    'residential-highrise-2.jpg',
    'residential-highrise-3.jpg',
    'residential-highrise-4.jpg',
    'residential-highrise-5.jpg',
    'residential-low-density-7.jpg',
    'residential-low-density-housin.jpg',
    'residential-low-density-housing-2.jpg',
    'residential-low-density-housing-3.jpg',
    'residential-low-density-housing-5.jpg',
    'residential-low-density-housing-6.jpg',
    'residential-low-density-housing-7.jpg',
    'residential-low-density-housing-8.jpg',
    'residential-low-density-sf-housing.jpg',
    'residential-med-density-housing-2.jpg',
    'residential-med-density-housing-3.jpg',
    'residential-med-density-housing.jpg',
    'residential-med-high-density-housing.jpg',
    'residential-sf-house-3.jpg',
    'residential-sf-low-density-housing.jpg',
    'residential-small-sf-house-2.jpg',
    'residential-small-sf-house.jpg',
    'residential-urban-house.jpg',
    'tourism-attraction.jpg',
    'tourism-hotel-1.jpg',
    'tourism-hotel-2.jpg',
    'tourism-hotel-3.jpg',
    'tourism-hotel-4.jpg',
    'tourism-hotel-5.jpg',
    'tourism-hotel-8.jpg',
    'tourism-hotel-9.jpg',
    'transport-road-1.jpg',
    'transport-road-2.jpg',
    'transport-road-3.jpg',
    'transport-road-4.jpg',
    'transport-road-5.jpg',
    'transport-road-8.jpg',
    'transport-road-9.jpg',
    'transport-road-10.jpg',
    'transport-road-11.jpg',
    'transport-road-12.jpg'];

app.post('/set_asset_details', function (request, response) {

    const projectid = request.body.projectid;
    const diagramid = request.body.diagramid;
    const asset_details = JSON.parse(request.body.asset_details);

    const representative_image = asset_details['metadata']['representative_image'];
    const key = projectid + '-' + diagramid;

    redisclient.hmset(key, { "representative_image": representative_image, "asset_details": JSON.stringify(asset_details) });

    // redisclient.hset(key, "asset_details", JSON.stringify(asset_details));
    // redisclient.hset(key, "representative_image", representative_image);

    response.contentType('application/json');
    response.send({
        "status": 1
    });
});

app.post('/get_diagram_details', function (request, response) {
    const projectid = request.body.projectid;
    const diagramid = request.body.diagramid;
    
    var apikey = request.body.apitoken;
    var cred = "Token " + apikey;
    var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';
    var URLS = [diagramdetailurl];
    async.map(URLS, function (url, done) {
        req({
            url: url,
            headers: {
                "Authorization": cred,
                "Content-Type": "application/json"
            }
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return done(err || new Error());
            }
            return done(null, JSON.parse(body));
        });
    }, function (err, results) {
        if (err) return response.sendStatus(500);

        var diagramdetail = results[0];

        
        var rediskey = projectid + "-" + diagramid;
        async.map([rediskey], function (rkey, done) {

            redisclient.HGETALL(rkey, function (err, results) {

                if (err || results == null) {
                    return done(null, JSON.stringify({
                        "capex": "0",
                        "opex": "0",
                        "asga": "0",
                        "acf": "0",
                        "capex_start": "0",
                        "representative_image": "",
                        "capex_end": "1",
                        "acf_start": "0",
                        "asset_details": {}
                    }));
                } else {
                    return done(null, results);
                }
            });
        },
            function (error, op) {
                //only OK once set
                if (err) return response.sendStatus(500);
                // op = JSON.parse(op);
                opts = {
                    "defaultvalues": JSON.parse(op[0]),
                    "diagramid": diagramid,
                    "title": results[0].description,
                    "diagramdetail": results[0],
                   };

                response.contentType('application/json');
                response.send({
                    opts
                });
        });

    });


});

app.post('/get_asset_details', function (request, response) {

    const apikey = request.body.apitoken;
    const cred = "Token " + apikey;
    const projectid = request.body.projectid;
    const cteamid = request.body.cteamid;
    const synthesisid = request.body.synthesisid;
    const boardid = request.body.boardid;
    const synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/';
    const systemsurl = baseurl + projectid + '/systems/';
    const boundsurl = baseurl + projectid + '/bounds/';    
    const syndiagramsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/diagrams/';
    const boardsurl = baseurl + projectid + '/boards/' + boardid + '/gantt/';
    const projecturl = baseurl + projectid + '/';

    const URLS = [synprojectsurl, boundsurl, systemsurl, projecturl, syndiagramsurl, boardsurl];

    async.map(URLS, function (url, done) {
        req({
            url: url,
            headers: {
                "Authorization": cred,
                "Content-Type": "application/json"
            }
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return done(err || new Error());
            }
            return done(null, JSON.parse(body));
        });
    }, function (err, results) {
        if (err) return response.sendStatus(500);

        var sURls = [];
        var systems = results[2];
        for (var x = 0; x < systems.length; x++) {
            var curSys = systems[x];
            var systemdetailurl = baseurl + projectid + '/systems/' + curSys['id'] + '/';
            sURls.push(systemdetailurl);
        }

        var syn_diag_list = results[4];

        var redis_keys = [];
        for (var i = syn_diag_list['diagrams'].length - 1; i >= 0; i--) {
            const cur_key = projectid + "-" + syn_diag_list['diagrams'][i]
            redis_keys.push(cur_key);
        }

        async.map(sURls, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, sysdetails) {
            if (err) return response.sendStatus(500);
            // var timeline = results[2]['timeline'];

            var keyDetails = {};

            async.map(redis_keys, function (rkey, done) {
                redisclient.HGETALL(rkey, function (err, redis_results) {

                    if (err || redis_results == null) {
                        return done(null, {
                            "key": rkey,
                            "capex": "0",
                            "opex": "0",
                            "asga": "0",
                            "acf": "0",
                            "capex_start": "0",
                            "capex_end": "1",
                            "wacc": "0",
                            "acf_start": "0",
                            "representative_image": "",
                            "asset_details": {}
                        });
                    } else {
                        var rr = redis_results
                        rr["key"] = rkey;
                        return done(null, rr);
                    }
                });
            },
                function (error, op) {
                    //only OK once set

                    if (err) return response.sendStatus(500);


                    opts = {
                        "csrfToken": request.csrfToken(),
                        "apitoken": request.query.apitoken,
                        "projectid": request.query.projectid,
                        "status": 1,
                        "design": JSON.stringify(results[0]),
                        "bounds": JSON.stringify(results[1]),
                        "systems": JSON.stringify(results[2]),
                        // "timeline": JSON.stringify(timeline),
                        "projectdetails": JSON.stringify(results[3]),
                        "syndiagrams": JSON.stringify(results[4]),
                        "systemdetail": JSON.stringify(sysdetails),
                        "saved_diagram_details": JSON.stringify(op)
                    };
                        
                    response.contentType('application/json');
                    response.send({
                        opts
                    });
                });
        });
    });


});

app.post('/set_financials', function (request, response) {

    const projectid = request.body.projectid;
    const diagramid = request.body.diagramid;
    const capex = request.body.capex;
    const acf = request.body.acf;
    const opex = request.body.opex;
    const asga = request.body.asga;
    const capex_start = request.body.capex_start;
    const capex_end = request.body.capex_end;
    const acfg = request.body.acfg;
    const wacc = request.body.wacc;
    const acf_start = request.body.acf_start;

    const key = projectid + '-' + diagramid;

    redisclient.hmset(key, {
        "capex": capex,
        "acf": acf,
        "opex": opex,
        "asga": asga,
        "acfg": acfg,
        "wacc": wacc,
        "capex_start": capex_start,
        "capex_end": capex_end,
        "acf_start": acf_start
    });

    response.contentType('application/json');
    response.send({
        "status": 1
    });
});

app.get('/financials', function (request, response) {
    var opts = {};
    
    if (request.query.apitoken && request.query.projectid && request.query.diagramid) {
        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var diagramid = request.query.diagramid;
        var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';
        var systemsurl = baseurl + projectid + '/systems/';
        var projectsurl = baseurl + projectid + '/';

        var URLS = [diagramdetailurl, systemsurl, projectsurl];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {
            if (err) return response.sendStatus(500);

            var diagramdetail = results[0];
            var projectdetails = results[2];

            var systemdetailurl = baseurl + projectid + '/systems/' + diagramdetail['sysid'] + '/';

            var sURls = [systemdetailurl];

            async.map(sURls, function (url, done) {
                req({
                    url: url,
                    headers: {
                        "Authorization": cred,
                        "Content-Type": "application/json"
                    }
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function (err, sysdetails) {
                if (err) return response.sendStatus(500);

                var rediskey = projectid + "-" + diagramid;
                async.map([rediskey], function (rkey, done) {

                    redisclient.HGETALL(rkey, function (err, results) {
                        if (err || results == null) {
                            return done(null, JSON.stringify({
                                "capex": 0,
                                "opex": 0,
                                "asga": 0,
                                "wacc": 0,
                                "acf": 0,
                                "capex_start": 0,
                                "representative_image": "",
                                "capex_end": 1,
                                "acf_start": 0,
                                "asset_details": {}
                            }));
                        } else {
                            return done(null, results);
                        }
                    });
                },
                    function (error, op) {

                        //only OK once set
                        if (err) return response.sendStatus(500);
                        op = op[0];

                        if (typeof op == 'string') {
                            op = JSON.parse(op);
                        }
                        if (!("capex" in op)) {
                            op["capex"] = 0;
                            op["opex"] = 0;
                            op["asga"] = 0;
                            op["wacc"] = 0;
                            op["acf"] = 0;
                            op["capex_start"] = 0;
                            op["capex_end"] = 0;
                            op["acf_start"] = 0;
                        }

                        const projecttype = projectdetails['projecttype'];
                       
                        opts = {
                            "csrfToken": request.csrfToken(),
                            "apitoken": request.query.apitoken,
                            "projectid": request.query.projectid,
                            "status": 1,
                            "defaultvalues": JSON.stringify(op),
                            "diagramid": diagramid,
                            "title": results[0].description,
                            "diagramdetail": JSON.stringify(results[0]),
                            "systems": JSON.stringify(results[1]),
                            "systemdetail": JSON.stringify(sysdetails[0]),
                            "projecttype": projecttype
                        };
                        response.render('financialanalysis', opts);
                    });

            });

        });

    }
    else {
        response.sendStatus(400);
    }
});

app.get('/investments', function (request, response) {
    var opts = {};
    
    if (request.query.apitoken && request.query.projectid && request.query.diagramid) {

        var apikey = request.query.apitoken;
        var cred = "Token " + apikey;
        var projectid = request.query.projectid;
        var diagramid = request.query.diagramid;
        var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';
        var systemsurl = baseurl + projectid + '/systems/';
        var projectsurl = baseurl + projectid + '/';

        var URLS = [diagramdetailurl, systemsurl, projectsurl];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {
            if (err) return response.sendStatus(500);

            var diagramdetail = results[0];
            var projectdetails = results[2];

            var systemdetailurl = baseurl + projectid + '/systems/' + diagramdetail['sysid'] + '/';

            var sURls = [systemdetailurl];

            async.map(sURls, function (url, done) {
                req({
                    url: url,
                    headers: {
                        "Authorization": cred,
                        "Content-Type": "application/json"
                    }
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function (err, sysdetails) {
                if (err) return response.sendStatus(500);

                var rediskey = projectid + "-" + diagramid;
                async.map([rediskey], function (rkey, done) {

                    redisclient.HGETALL(rkey, function (err, results) {

                        if (err || results == null) {
                            return done(null, JSON.stringify({
                                "capex": "0",
                                "opex": "0",
                                "asga": "0",
                                "acf": "0",
                                "capex_start": "0",
                                "representative_image": "",
                                "capex_end": "1",
                                "acf_start": "0",
                                "asset_details": {}
                            }));
                        } else {
                            return done(null, results);
                        }
                    });
                },
                    function (error, op) {
                        //only OK once set
                        if (err) return response.sendStatus(500);
                        // op = JSON.parse(op);

                        const projecttype = projectdetails['projecttype'];
                        opts = {
                            "csrfToken": request.csrfToken(),
                            "apitoken": request.query.apitoken,
                            "projectid": request.query.projectid,
                            "status": 1,
                            "defaultvalues": JSON.stringify(op[0]),
                            "diagramid": diagramid,
                            "title": results[0].description,
                            "diagramdetail": JSON.stringify(results[0]),
                            "systems": JSON.stringify(results[1]),
                            "systemdetail": JSON.stringify(sysdetails[0]),
                            "projecttype": projecttype,
                            "all_image_files": JSON.stringify(image_files)
                        };
                        response.render('assetanalysis', opts);
                    });

            });

        });

    } else if (request.query.apitoken && request.query.projectid && request.query.synthesisid && request.query.cteamid && request.query.boardid) {

        const apikey = request.query.apitoken;
        const cred = "Token " + apikey;
        const projectid = request.query.projectid;
        const cteamid = request.query.cteamid;
        const synthesisid = request.query.synthesisid;
        const boardid = request.query.boardid;
        const synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/';
        // const timelineurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/timeline/';
        const systemsurl = baseurl + projectid + '/systems/';
        const boundsurl = baseurl + projectid + '/bounds/';
        const boundaryurl = baseurl + projectid + '/boundaries/';
        const syndiagramsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/diagrams/';
        const boardsurl = baseurl + projectid + '/boards/' + boardid + '/gantt/';
        const projecturl = baseurl + projectid + '/';
        const URLS = [synprojectsurl, boundsurl, systemsurl, projecturl, syndiagramsurl, boundaryurl, boardsurl];

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {
            if (err) return response.sendStatus(500);

            var sURls = [];
            var systems = results[2];
            for (x = 0; x < systems.length; x++) {
                var curSys = systems[x];
                var systemdetailurl = baseurl + projectid + '/systems/' + curSys['id'] + '/';
                sURls.push(systemdetailurl);
            }

            var syn_diag_list = results[4];

            var redis_keys = [];
            for (var i = syn_diag_list['diagrams'].length - 1; i >= 0; i--) {
                const cur_key = projectid + "-" + syn_diag_list['diagrams'][i]
                redis_keys.push(cur_key);
            }

            async.map(sURls, function (url, done) {
                req({
                    url: url,
                    headers: {
                        "Authorization": cred,
                        "Content-Type": "application/json"
                    }
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function (err, sysdetails) {
                if (err) return response.sendStatus(500);
                // var timeline = results[2]['timeline'];

                var keyDetails = {};

                async.map(redis_keys, function (rkey, done) {
                    redisclient.HGETALL(rkey, function (err, redis_results) {

                        if (err || redis_results == null) {
                            return done(null, {
                                "key": rkey,
                                "capex": "0",
                                "opex": "0",
                                "asga": "0",
                                "acf": "0",
                                "capex_start": "0",
                                "capex_end": "1",
                                "wacc": "0",
                                "acf_start": "0",
                                "representative_image": "",
                                "asset_details": {}
                            });
                        } else {
                            var rr = redis_results
                            rr["key"] = rkey;
                            return done(null, rr);
                        }
                    });
                },
                    function (error, op) {
                        //only OK once set

                        if (err) return response.sendStatus(500);


                        opts = {
                            "csrfToken": request.csrfToken(),
                            "apitoken": request.query.apitoken,
                            "projectid": request.query.projectid,
                            "status": 1,
                            "design": JSON.stringify(results[0]),
                            "bounds": JSON.stringify(results[1]),
                            "systems": JSON.stringify(results[2]),
                            // "timeline": JSON.stringify(timeline),
                            "projectdetails": JSON.stringify(results[3]),
                            "syndiagrams": JSON.stringify(results[4]),
                            "boundaries": JSON.stringify(results[5].geojson),
                            "systemdetail": JSON.stringify(sysdetails),
                            "sequence": JSON.stringify(results[6]),
                            "saved_diagram_details": JSON.stringify(op)
                        };
                        response.render('investmentanalysis', opts);
                    });
            });
        });
    }
    else {
        response.sendStatus(400);
    }
});

app.get('/', function (request, response) {
    var opts = {};
    

        const apikey = request.query.apitoken;
        const cred = "Token " + apikey;
        const projectid = request.query.projectid;
        const cteamid = request.query.cteamid;
        const synthesisid = request.query.synthesisid;
        const boardid = request.query.boardid;
        const synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/';
        // const timelineurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/timeline/';
        const systemsurl = baseurl + projectid + '/systems/';
        const boundsurl = baseurl + projectid + '/bounds/';
        const syndiagramsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/diagrams/';
        const boardsurl = baseurl + projectid + '/boards/' + boardid + '/gantt/';
        const projecturl = baseurl + projectid + '/';
        const URLS = [synprojectsurl, boundsurl, systemsurl, projecturl, syndiagramsurl, boardsurl];

        const design_url_details = {'boardid':boardid,'cteamid':cteamid,'synthesisid':synthesisid}

        async.map(URLS, function (url, done) {
            req({
                url: url,
                headers: {
                    "Authorization": cred,
                    "Content-Type": "application/json"
                }
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return done(err || new Error());
                }
                return done(null, JSON.parse(body));
            });
        }, function (err, results) {
            if (err) return response.sendStatus(500);

            var sURls = [];
            var systems = results[2];
            for (x = 0; x < systems.length; x++) {
                var curSys = systems[x];
                var systemdetailurl = baseurl + projectid + '/systems/' + curSys['id'] + '/';
                sURls.push(systemdetailurl);
            }

            var syn_diag_list = results[4];

            var redis_keys = [];
            for (var i = syn_diag_list['diagrams'].length - 1; i >= 0; i--) {
                const cur_key = projectid + "-" + syn_diag_list['diagrams'][i]
                redis_keys.push(cur_key);
            }

            async.map(sURls, function (url, done) {
                req({
                    url: url,
                    headers: {
                        "Authorization": cred,
                        "Content-Type": "application/json"
                    }
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return done(err || new Error());
                    }
                    return done(null, JSON.parse(body));
                });
            }, function (err, sysdetails) {
                if (err) return response.sendStatus(500);
                // var timeline = results[2]['timeline'];

                var keyDetails = {};
                async.map(redis_keys, function (rkey, done) {
                    redisclient.HGETALL(rkey, function (err, redis_results) {
                        if (err || redis_results == null) {
                            return done(null, {
                                "key": rkey,
                                "capex": "0",
                                "opex": "0",
                                "asga": "0",
                                "acf": "0",
                                "capex_start": "0",
                                "capex_end": "1",
                                "wacc": "0",
                                "acf_start": "0",
                                "representative_image": "",
                                "asset_details": {}
                            });
                        } else {
                            var rr = redis_results
                            rr["key"] = rkey;
                            return done(null, rr);
                        }
                    });
                },
                    function (error, op) {
                        //only OK once set

                        if (err) return response.sendStatus(500);

                        const projecttype = results[3]['projecttype'];
                          
                        opts = {
                            "csrfToken": request.csrfToken(),
                            "apitoken": request.query.apitoken,
                            "projectid": request.query.projectid,
                            "status": 1,
                            "design": JSON.stringify(results[0]),
                            // "timeline": JSON.stringify(timeline),
                            "systems": JSON.stringify(results[2]),
                            "projectdetails": JSON.stringify(results[3]),
                            "projecttype":projecttype,
                            "syndiagrams": JSON.stringify(results[4]),
                            "systemdetail": JSON.stringify(sysdetails),
                            "sequence": JSON.stringify(results[6]),
                            "saved_diagram_details": JSON.stringify(op), 
                            "design_url_details":JSON.stringify(design_url_details)
                        };
                        response.render('new-financials', opts);
                    });
            });
        });
    
});

// app.get('/archive', function (request, response) {
//     var opts = {};

//     if (request.query.apitoken && request.query.projectid && request.query.diagramid) {

//         var apikey = request.query.apitoken;
//         var cred = "Token " + apikey;
//         var projectid = request.query.projectid;
//         var diagramid = request.query.diagramid;
//         var diagramdetailurl = baseurl + projectid + '/diagrams/' + diagramid + '/';
//         var systemsurl = baseurl + projectid + '/systems/';
//         var projectsurl = baseurl + projectid + '/';

//         var URLS = [diagramdetailurl, systemsurl, projectsurl];

//         async.map(URLS, function (url, done) {
//             req({
//                 url: url,
//                 headers: {
//                     "Authorization": cred,
//                     "Content-Type": "application/json"
//                 }
//             }, function (err, response, body) {
//                 if (err || response.statusCode !== 200) {
//                     return done(err || new Error());
//                 }
//                 return done(null, JSON.parse(body));
//             });
//         }, function (err, results) {
//             if (err) return response.sendStatus(500);

//             var diagramdetail = results[0];
//             var projectdetails = results[2];

//             var systemdetailurl = baseurl + projectid + '/systems/' + diagramdetail['sysid'] + '/';

//             var sURls = [systemdetailurl];

//             async.map(sURls, function (url, done) {
//                 req({
//                     url: url,
//                     headers: {
//                         "Authorization": cred,
//                         "Content-Type": "application/json"
//                     }
//                 }, function (err, response, body) {
//                     if (err || response.statusCode !== 200) {
//                         return done(err || new Error());
//                     }
//                     return done(null, JSON.parse(body));
//                 });
//             }, function (err, sysdetails) {
//                 if (err) return response.sendStatus(500);

//                 var rediskey = projectid + "-" + diagramid;
//                 async.map([rediskey], function (rkey, done) {

//                     redisclient.HGETALL(rkey, function (err, results) {

//                         if (err || results == null) {
//                             return done(null, JSON.stringify({
//                                 "capex": "0",
//                                 "opex": "0",
//                                 "asga": "0",
//                                 "acf": "0",
//                                 "capex_start": "0",
//                                 "representative_image": "",
//                                 "capex_end": "1",
//                                 "acf_start": "0",
//                                 "asset_details": {}
//                             }));
//                         } else {
//                             return done(null, results);
//                         }
//                     });
//                 },
//                     function (error, op) {
//                         //only OK once set
//                         if (err) return response.sendStatus(500);
//                         // op = JSON.parse(op);

//                         const projecttype = projectdetails['projecttype'];
//                         opts = {
//                             "csrfToken": request.csrfToken(),
//                             "apitoken": request.query.apitoken,
//                             "projectid": request.query.projectid,
//                             "status": 1,
//                             "defaultvalues": JSON.stringify(op[0]),
//                             "diagramid": diagramid,
//                             "title": results[0].description,
//                             "diagramdetail": JSON.stringify(results[0]),
//                             "systems": JSON.stringify(results[1]),
//                             "systemdetail": JSON.stringify(sysdetails[0]),
//                             "projecttype": projecttype,
//                             "all_image_files": JSON.stringify(image_files)
//                         };
//                         response.render('assetanalysis', opts);
//                     });

//             });

//         });

//     }
//     else if (request.query.apitoken && request.query.projectid && request.query.synthesisid && request.query.cteamid && request.query.boardid) {

//         const apikey = request.query.apitoken;
//         const cred = "Token " + apikey;
//         const projectid = request.query.projectid;
//         const cteamid = request.query.cteamid;
//         const synthesisid = request.query.synthesisid;
//         const boardid = request.query.boardid;
//         const synprojectsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/';
//         // const timelineurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/timeline/';
//         const systemsurl = baseurl + projectid + '/systems/';
        
//         const boundsurl = baseurl + projectid + '/bounds/';
//         const boundaryurl = baseurl + projectid + '/boundaries/';
//         const syndiagramsurl = baseurl + projectid + '/cteams/' + cteamid + '/' + synthesisid + '/diagrams/';
//         const boardsurl = baseurl + projectid + '/boards/' + boardid + '/gantt/';
//         const projecturl = baseurl + projectid + '/';
//         const URLS = [synprojectsurl, boundsurl, systemsurl, projecturl, syndiagramsurl, boundaryurl, boardsurl];

//         async.map(URLS, function (url, done) {
//             req({
//                 url: url,
//                 headers: {
//                     "Authorization": cred,
//                     "Content-Type": "application/json"
//                 }
//             }, function (err, response, body) {
//                 if (err || response.statusCode !== 200) {
//                     return done(err || new Error());
//                 }
//                 return done(null, JSON.parse(body));
//             });
//         }, function (err, results) {
//             if (err) return response.sendStatus(500);

//             var sURls = [];
//             var systems = results[2];
//             for (x = 0; x < systems.length; x++) {
//                 var curSys = systems[x];
//                 var systemdetailurl = baseurl + projectid + '/systems/' + curSys['id'] + '/';
//                 sURls.push(systemdetailurl);
//             }

//             var syn_diag_list = results[4];

//             var redis_keys = [];
//             for (var i = syn_diag_list['diagrams'].length - 1; i >= 0; i--) {
//                 const cur_key = projectid + "-" + syn_diag_list['diagrams'][i]
//                 redis_keys.push(cur_key);
//             }
            
//             async.map(sURls, function (url, done) {
//                 req({
//                     url: url,
//                     headers: {
//                         "Authorization": cred,
//                         "Content-Type": "application/json"
//                     }
//                 }, function (err, response, body) {
//                     if (err || response.statusCode !== 200) {
//                         return done(err || new Error());
//                     }
//                     return done(null, JSON.parse(body));
//                 });
//             }, function (err, sysdetails) {
//                 if (err) return response.sendStatus(500);
//                 // var timeline = results[2]['timeline'];

//                 var keyDetails = {};
//                 async.map(redis_keys, function (rkey, done) {
//                     redisclient.HGETALL(rkey, function (err, redis_results) {
//                         if (err || redis_results == null) {
//                             return done(null, {
//                                 "key": rkey,
//                                 "capex": "0",
//                                 "opex": "0",
//                                 "asga": "0",
//                                 "acf": "0",
//                                 "capex_start": "0",
//                                 "capex_end": "1",
//                                 "wacc": "0",
//                                 "acf_start": "0",
//                                 "representative_image": "",
//                                 "asset_details": {}
//                             });
//                         } else {
//                             var rr = redis_results
//                             rr["key"] = rkey;
//                             return done(null, rr);
//                         }
//                     });
//                 },
//                     function (error, op) {
//                         //only OK once set

//                         if (err) return response.sendStatus(500);

//                         opts = {
//                             "csrfToken": request.csrfToken(),
//                             "apitoken": request.query.apitoken,
//                             "projectid": request.query.projectid,
//                             "status": 1,
//                             "design": JSON.stringify(results[0]),
//                             "bounds": JSON.stringify(results[1]),
//                             "systems": JSON.stringify(results[2]),
//                             // "timeline": JSON.stringify(timeline),
//                             "projectdetails": JSON.stringify(results[3]),
//                             "syndiagrams": JSON.stringify(results[4]),
//                             "boundaries": JSON.stringify(results[5].geojson),
                            
//                             "systemdetail": JSON.stringify(sysdetails),
//                             "sequence": JSON.stringify(results[6]),
//                             "saved_diagram_details": JSON.stringify(op)
//                         };
//                         response.render('investmentanalysis', opts);
//                     });
//             });
//         });
//     }
//     else {
//         response.sendStatus(400);
//     }
// });
app.listen(process.env.PORT || 5001);