/**
 * Created by jahon on 14/10/29.
 */

var gulp         = require('gulp'),
    clean        = require('gulp-clean'),
    concat       = require('gulp-concat'),
    uglify       = require('gulp-uglify'),
    rev          = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    revFormat    = require('gulp-rev-format'),
    minifyHTML   = require('gulp-minify-html'),
    filename     = require('gulp-asset-manifest'),
    sass         = require('gulp-sass'),
    less         = require('gulp-less'),
    minifyCss    = require('gulp-minify-css'),
    imagemin     = require('gulp-imagemin'),
    pngquant     = require('imagemin-pngquant'),
    zip          = require('gulp-zip'),
    jsoncombine  = require("gulp-jsoncombine"),
    revDel       = require('rev-del'),
    fs           = require('fs'),
    _            = require('lodash'),
    async        = require('async'),
    path         = require('path'),
    dateFormat   = require('dateformat'),
    mime         = require('mime-types'),
    runSequence  = require('run-sequence').use(gulp);

var BUILD_CONFIG = {
    //包名称
    bundleName: 'qiy',
    //静态资源包根目录
    root: 'assets',
    //是否使用require.js
    useRequirejs: true,
    // debug: false,
    version: '1.0.8',
    //暂时考虑单域名
    host: '127.0.0.1'
};

/**********************************************/
/*****************script打包********************/
var BASEPATH   = 'assets/dist',
    BASEPATH_V = BASEPATH + '/' + BUILD_CONFIG.version + '/' + BUILD_CONFIG.host,
    DISTPATH   = BASEPATH_V + '/js',
    SRCPATH    = 'assets/js';

gulp.task('clean', function () {
    return gulp.src(BASEPATH_V, {read: false})
        .pipe(clean());
});

gulp.task('js', function () {
    return gulp.src([SRCPATH, '/**/*.js'].join(''))
        .pipe(uglify({
            mangle: {except: ['define', 'require', 'module', 'exports']},
            compress: false,
            preserveComments: "some"
        }))
        .pipe(rev())
        .pipe(revFormat({
            prefix: '-',
            suffix: '',
            lastExt: true
        }))
        .pipe(gulp.dest(DISTPATH))
        .pipe(rev.manifest('rev-manifest-scripts.json'))
        .pipe(filename({bundleName: BUILD_CONFIG.bundleName + '.scripts'}))
        .pipe(revDel({dest: DISTPATH}))
        .pipe(gulp.dest(BASEPATH_V + '/rev/js'))
});

gulp.task('writefile', function (cb) {
    async.auto({
        manifest: function (callback) {
            gulp.src(BASEPATH_V + '/rev/js/rev-manifest-scripts.json', {buffer: false})
                .on('data', function (file) {
                    var stream = file.contents;
                    stream.on('data', function (chunk) {
                        callback(null, chunk.toString())
                    });
                });
        },
        main: function (callback) {
            gulp.src(SRCPATH + '/main.js', {buffer: false})
                .on('data', function (file) {
                    var stream = file.contents;
                    stream.on('data', function (chunk) {
                        callback(null, chunk.toString())
                    });
                });
        }
    }, function (err, results) {
        //console.log(results)

        var manifest = JSON.parse(results.manifest) || {};
        var main = results.main;

        for (var key in manifest) {
            main = main.replace(key.replace(/\.js$/gi, ''), manifest[key].replace(/\.js$/gi, ''));
        }

        main = main.replace('/js/src/', '/js/');

        fs.writeFile(__dirname + '/' + DISTPATH + '/main.js', main, cb);

    })
});

gulp.task('reset', function () {

    return gulp.src([DISTPATH + '/main.js'])
        .pipe(uglify({
            mangle: {except: ['define', 'require', 'module', 'exports']},
            compress: false,
            preserveComments: 'some'
        }))
        .pipe(rev())
        .pipe(gulp.dest(DISTPATH))
        .pipe(rev.manifest("rev-manifest-scripts-main.json", {merge: true, cwd: ''}))
        .pipe(revDel({dest: DISTPATH}))
        .pipe(clean())
        .pipe(gulp.dest(BASEPATH_V + '/rev/js'))
});

gulp.task('combine', function () {
    async.series({
        manifest1: function (callback) {
            gulp.src(BASEPATH_V + '/rev/js/rev-manifest-scripts.json', {buffer: false})
                .on('data', function (file) {
                    var stream = file.contents;
                    stream.on('data', function (chunk) {
                        callback(null, chunk.toString())
                    });
                });
        },
        manifest2: function (callback) {
            gulp.src(BASEPATH_V + '/rev/js/rev-manifest-scripts-main.json', {buffer: false})
                .on('data', function (file) {
                    var stream = file.contents;
                    stream.on('data', function (chunk) {
                        callback(null, chunk.toString())
                    });
                });
        }
    }, function (err, results) {

        var manifest1 = JSON.parse(results.manifest1) || {};
        var manifest2 = JSON.parse(results.manifest2) || {};

        _.extend(manifest1, manifest2);

        fs.writeFile(__dirname + '/' + BASEPATH_V + '/rev/js/rev-manifest-scripts.json', JSON.stringify(manifest1))

    })
});

gulp.task('del-manifest', function () {
    var dir = __dirname + '/' + BASEPATH_V + '/rev/js';
    // var dirMain = __dirname + '/' + BASEPATH_V + '/js';
    var exceptPaths = [
        'rev-manifest-scripts.json'
    ];
    var json = JSON.parse(fs.readFileSync(dir + '/rev-manifest-scripts-main.json')) || {};
    for (var key in json) exceptPaths.push(json[key]);

    // exceptPaths.map(function (p) {return p});

    var files = [];

    //manifest
    fs.readdirSync(dir).forEach(function (path) {
        if (fs.statSync(dir + '/' + path).isFile()) {
            files.push(path)
        }
    });

    var newArr = _.difference(files, exceptPaths).map(function (p) { return BASEPATH_V + '/rev/js/' + p});

    console.log(files, exceptPaths)

    return gulp.src(newArr, {read: false})
        .pipe(clean());

});
//delete old manifest files
gulp.task('del-main', function () {
    var exceptPaths = [];
    var dir = __dirname + '/' + BASEPATH_V + '/rev/js';
    var json = JSON.parse(fs.readFileSync(dir + '/rev-manifest-scripts-main.json')) || {};
    for (var key in json) exceptPaths.push(json[key]);

    console.log(json[key])
    return gulp.src([
        '!' + DISTPATH + '/' + json[key],
        DISTPATH + '/main*.js'
    ])
        .pipe(clean())

});

gulp.task('step1', function (cb) {
    runSequence('clean', 'js', 'writefile', cb);
});
gulp.task('step2', ['step1'], function (cb) {
    runSequence('reset', cb);
});
gulp.task('step3', ['step2'], function (cb) {
    runSequence('combine', cb);
});
gulp.task('step4', ['step3'], function (cb) {
    runSequence('del-main', cb);
});
gulp.task('step5', ['step4'], function (cb) {
    runSequence('del-manifest', cb);
});

/**********************************************/
/*****************styles打包********************/

var STYLES_DISTPATH = BASEPATH_V + '/styles',
    STYLES_SRCPATH  = 'assets/styles';

gulp.task('sass', function () {
    return gulp.src(STYLES_SRCPATH + '/sass/**/*.scss')
        .pipe(sass({outputStyle: 'compressed', errLogToConsole: true}).on('error', sass.logError))
        .pipe(rev())
        .pipe(revFormat({
            prefix: '-',
            suffix: '',
            lastExt: true
        }))
        .pipe(gulp.dest(STYLES_DISTPATH))
        .pipe(rev.manifest('rev-manifest-sass.json'))
        .pipe(filename({bundleName: BUILD_CONFIG.bundleName + '.sass'}))
        // .pipe(gulp.dest(STYLES_DISTPATH));
        .pipe(gulp.dest(BASEPATH_V + '/rev/styles/css'))
});

gulp.task('less', function () {
    //'/less/?(footer|global|home|search).less',
    var paths = [];
    var obj = {
        complies: [
            '/less/**/*.less'
        ],
        ignore: [
            '/less/_*.less'
        ]
    };
    obj.ignore.forEach(function (p) {paths.push('!' + STYLES_SRCPATH + p)});
    obj.complies.forEach(function (p) {paths.push(STYLES_SRCPATH + p)});

    //paths.push('!' + STYLES_SRCPATH + '/less/_*.less');
    //console.log(paths)

    return gulp.src(paths)
    //.pipe(function (err,data) {
    //
    //    console.log(err,data)
    //    return data;
    //
    //})
        .pipe(less())
        .pipe(minifyCss())
        .pipe(rev())
        .pipe(revFormat({
            prefix: '-',
            suffix: '',
            lastExt: true
        }))
        .pipe(gulp.dest(STYLES_DISTPATH))
        .pipe(rev.manifest('rev-manifest-less.json'))
        .pipe(filename({bundleName: BUILD_CONFIG.bundleName + '.less'}))
        .pipe(gulp.dest(BASEPATH_V + '/rev/styles/css'))
});

gulp.task('step6', ['step5'], function (cb) {
    runSequence('less', 'sass', cb);
});

/**********************************************/
/*****************images优化********************/

var IMAGE_DISTPATH = BASEPATH_V + '/images',
    IMAGE_SRCPATH  = 'assets/images';

//图片不做rev处理
gulp.task('image', function () {
    return gulp.src(IMAGE_SRCPATH + '/**/*.{gif,jpg,jpeg,png,bmp,svg}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(IMAGE_DISTPATH))
        .pipe(rev())
        .pipe(rev.manifest('rev-manifest-image.json'))
        .pipe(filename({bundleName: BUILD_CONFIG.bundleName + '.image'}))
        .pipe(gulp.dest(BASEPATH_V + '/rev/images'))
        .on('data', function (file) {
            var data = file.contents.toString(),
                obj  = {},
                temp = {};
            _.each(_.keys(JSON.parse(data)), function (filename) {
                obj[filename] = filename;
                _.extend(temp, obj)
            })
            fs.writeFile(__dirname + '/' + BASEPATH_V + '/rev/images/rev-manifest-image.json', JSON.stringify(temp), 'utf8');

            return new Buffer(JSON.stringify(temp), 'utf8')
        });
    //pipe(gulp.dest(BASEPATH_V + '/rev/images'));

});

gulp.task('step7', ['step6'], function (cb) {
    runSequence('image', cb);
});

//********************************************//
var HTML_DISTPATH = BASEPATH_V + '/pages',
    HTML_SRCPATH  = 'assets/pages';

gulp.task('html', function () {
    return gulp.src([HTML_SRCPATH, '/**/*.{html,shtml}'].join(''))
        .pipe(rev())
        .pipe(revFormat({
            prefix: '-',
            suffix: '',
            lastExt: true
        }))
        .pipe(gulp.dest(HTML_DISTPATH))
        .pipe(rev.manifest('rev-manifest-html.json'))
        .pipe(filename({bundleName: BUILD_CONFIG.bundleName + '.html'}))
        .pipe(revDel({dest: HTML_DISTPATH}))
        .pipe(gulp.dest(BASEPATH_V + '/rev/pages'))
});

gulp.task('rev', function () {
    return gulp.src([
        BASEPATH_V + '/rev/**/rev-*.json',
        BASEPATH_V + '/pages/**/*.{html,shtml}'
    ])
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                '/styles/css': '/styles/',
                '/js': '/js/'
                // ,
                // '/cdn/': function (manifest_value) {
                //     // http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js
                //     // return '//cdn' + (Math.floor(Math.random() * 9) + 1) + '.' + 'exsample.dot' + '/img/' + manifest_value;
                //
                //     // console.log('manifest_value:', manifest_value)
                //     return '//apps.bdimg.com/libs/jquery/2.1.4/' + manifest_value;
                // }
            }
        }))
        // .pipe(minifyHTML({
        //     empty: true,
        //     spare: true
        // }))
        .pipe(gulp.dest(HTML_DISTPATH));
});

gulp.task('step8', ['step7'], function (cb) {
    runSequence('html', cb);
});
gulp.task('step9', ['step8'], function (cb) {
    runSequence('rev', cb);
});

/**********************************************/
/*****************合并manifest、打包资源********************/

gulp.task('zip', function () {

    var dir = BASEPATH + '/' + BUILD_CONFIG.version;
    return gulp.src([
        '!' + dir + '/**/*.zip',
        '!' + dir + '/**/*rev/**',
        dir + '/**'
    ])
        .pipe(zip(BUILD_CONFIG.version + '.zip'))
        .pipe(gulp.dest(BASEPATH));
});

gulp.task('combine-manifest', function () {

    return gulp.src(['!' + BASEPATH_V + '/**/*-all.json', BASEPATH_V + '/**/rev-*.json'])
        .pipe(jsoncombine("resource.json", function (data) {
            var obj   = {
                    hosts: [],
                    version: BUILD_CONFIG.version,
                    //root: ROOT_PATH,
                    buildTime: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
                },
                temp  = {},
                temp2 = [];
            for (var k in data) {
                // console.log(data[k])
                _.extend(temp, data[k]);
            }

            _.each(_.values(temp), function (filename) {
                temp2.push({
                    path: filename,
                    mimeType: mime.lookup(filename)
                })
            })

            // console.log(temp2)
            obj.hosts.push({
                host: BUILD_CONFIG.host,
                resource: temp2
            });
            return new Buffer(JSON.stringify(obj), 'utf8')
        }))
        .pipe(gulp.dest(BASEPATH_V + '/rev'))
        .pipe(gulp.dest(path.join(BASEPATH_V)))
});

gulp.task('step10', ['step9'], function (cb) {
    runSequence('combine-manifest', cb);
});
gulp.task('step11', ['step10'], function (cb) {
    runSequence('zip', cb);
});

gulp.task('build', ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10', 'step11']);

gulp.task('dev');
gulp.task('default', ['build']);

