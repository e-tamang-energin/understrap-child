// Defining requirements
var gulp = require( 'gulp' );
var plumber = require( 'gulp-plumber' );
var sass = require( 'gulp-sass' );
var babel = require( 'gulp-babel' );
var postcss = require( 'gulp-postcss' );
var rename = require( 'gulp-rename' );
var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var imagemin = require( 'gulp-imagemin' );
var sourcemaps = require( 'gulp-sourcemaps' );
var browserSync = require( 'browser-sync' ).create();
var del = require( 'del' );
var cleanCSS = require( 'gulp-clean-css' );
var autoprefixer = require( 'autoprefixer' );

// Configuration file to keep your code DRY
var cfg = require( './gulpconfig.json' );
var paths = cfg.paths;

/**
 * Compiles .scss to .css files.
 *
 * Run: gulp sass
 */
gulp.task( 'sass', function() {
	return gulp
		.src( paths.sass + '/*.scss' )
		.pipe(
			plumber( {
				errorHandler( err ) {
					console.log( err );
					this.emit( 'end' );
				},
			} )
		)
		.pipe( sourcemaps.init( { loadMaps: true } ) )
		.pipe( sass( { errLogToConsole: true } ) )
		.pipe( postcss( [ autoprefixer() ] ) )
		.pipe( sourcemaps.write( undefined, { sourceRoot: null } ) )
		.pipe( gulp.dest( paths.css ) );
} );

/**
 * Optimizes images and copies images from src to dest.
 *
 * Run: gulp imagemin
 */
gulp.task( 'imagemin', () =>
	gulp
		.src( paths.imgsrc + '/**' )
		.pipe(
			imagemin(
				[
					// Bundled plugins
					imagemin.gifsicle( {
						interlaced: true,
						optimizationLevel: 3,
					} ),
					imagemin.mozjpeg( {
						quality: 100,
						progressive: true,
					} ),
					imagemin.optipng(),
					imagemin.svgo(),
				],
				{
					verbose: true,
				}
			)
		)
		.pipe( gulp.dest( paths.img ) )
);

/**
 * Minifies css files.
 *
 * Run: gulp minifycss
 */
gulp.task( 'minifycss', function() {
	return gulp
		.src( [
			paths.css + '/custom-editor-style.css',
			paths.css + '/child-theme.css',
		] )
		.pipe(
			sourcemaps.init( {
				loadMaps: true,
			} )
		)
		.pipe(
			cleanCSS( {
				compatibility: '*',
			} )
		)
		.pipe(
			plumber( {
				errorHandler( err ) {
					console.log( err );
					this.emit( 'end' );
				},
			} )
		)
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( sourcemaps.write( './' ) )
		.pipe( gulp.dest( paths.css ) );
} );

/**
 * Delete minified CSS files and their maps
 *
 * Run: gulp cleancss
 */
gulp.task( 'cleancss', function() {
	return del( paths.css + '/*.min.css*' );
} );

/**
 * Compiles .scss to .css minifies css files.
 *
 * Run: gulp styles
 */
gulp.task( 'styles', function( callback ) {
	gulp.series( 'sass', 'minifycss' )( callback );
} );

/**
 * Watches .scss, .js and image files for changes.
 * On change re-runs corresponding build task.
 * 
 * Run: gulp watch
 */
gulp.task( 'watch', function() {
	gulp.watch(
		[ paths.sass + '/**/*.scss', paths.sass + '/*.scss' ],
		gulp.series( 'styles' )
	);
	gulp.watch(
		[
			paths.dev + '/js/**/*.js',
			'js/**/*.js',
			'!js/child-theme.js',
			'!js/child-theme.min.js',
		],
		gulp.series( 'scripts' )
	);

	// Inside the watch task.
	gulp.watch( paths.imgsrc + '/**', gulp.series( 'imagemin-watch' ) );
} );

/**
 * Starts browser-sync task for starting the server.
 *
 * Run: gulp browser-sync
 */
gulp.task( 'browser-sync', function() {
	browserSync.init( cfg.browserSyncOptions );
} );

/**
 * Ensures the 'imagemin' task is complete before reloading browsers
 */
gulp.task(
	'imagemin-watch',
	gulp.series( 'imagemin', function() {
		browserSync.reload();
	} )
);

/**
 * Starts watcher with browser-sync.
 * Browser-sync reloads page automatically on your browser.
 * 
 * Run: gulp watch-bs
 */
gulp.task( 'watch-bs', gulp.parallel( 'browser-sync', 'watch' ) );

// Run:
// gulp scripts.
// Uglifies and concat all JS files into one
gulp.task( 'scripts', function() {
	var scripts = [
		// Start - All BS5 stuff
		paths.dev + '/js/bootstrap5/bootstrap.bundle.js',
		paths.dev + '/js/themejs/*.js',

		// End - All BS5 stuff

		// paths.dev + '/js/skip-link-focus-fix.js',

		// Adding currently empty javascript file to add on for your own themes´ customizations
		// Please add any customizations to this .js file only!
		paths.dev + '/js/custom-javascript.js',
	];
	gulp
		.src( scripts, { allowEmpty: true } )
		.pipe( babel( { presets: ['@babel/preset-env'] } ) )
		.pipe( concat( 'child-theme.min.js' ) )
		.pipe( uglify() )
		.pipe( gulp.dest( paths.js ) );

	return gulp
		.src( scripts, { allowEmpty: true } )
		.pipe( babel() )
		.pipe( concat( 'child-theme.js' ) )
		.pipe( gulp.dest( paths.js ) );
} );

// Deleting any file inside the /src folder
gulp.task( 'clean-source', function() {
	return del( [ 'src/**/*' ] );
} );

// Run:
// gulp copy-assets.
// Copy all needed dependency assets files from node_modules to theme's /js, /scss and /fonts folder. Run this task after npm update

////////////////// All Bootstrap SASS  Assets /////////////////////////
gulp.task( 'copy-assets', function( done ) {
	////////////////// All Bootstrap 5 Assets /////////////////////////
	// Copy all JS files
	var stream = gulp
		.src( paths.node + '/bootstrap/dist/js/**/*.js' )
		.pipe( gulp.dest( paths.dev + '/js/bootstrap5' ) );

	// Copy all Bootstrap SCSS files
	gulp
		.src( paths.node + '/bootstrap/scss/**/*.scss' )
		.pipe( gulp.dest( paths.dev + '/sass/bootstrap5' ) );

	////////////////// End Bootstrap 5 Assets /////////////////////////

	// Copy all Font Awesome Fonts
	gulp
		.src( paths.node + '/font-awesome/fonts/**/*.{ttf,woff,woff2,eot,svg}' )
		.pipe( gulp.dest( paths.fonts ) );

	// Copy all Font Awesome SCSS files
	gulp
		.src( paths.node + '/@fortawesome/fontawesome-free/scss/*.scss' )
		.pipe( gulp.dest( paths.dev + '/sass/fontawesome' )	);

	done();
} );

// Deleting the files distributed by the copy-assets task
gulp.task( 'clean-vendor-assets', function() {
	return del( [
		paths.dev + '/js/bootstrap5',
		paths.dev + '/sass/bootstrap5',
		paths.fonts + '/*wesome*.{ttf,woff,woff2,eot,svg}',
		paths.dev + '/sass/fontawesome',
		paths.js + paths.vendor,
	] );
} );

/**
 * Deletes all files inside the dist folder and the folder itself.
 *
 * Run: gulp clean-dist
 */
gulp.task( 'clean-dist', function() {
	return del( paths.dist );
} );

// Run
// gulp dist
// Copies the files to the dist folder for distribution as simple theme
gulp.task(
	'dist',
	gulp.series( [ 'clean-dist' ], function() {
		return gulp
			.src(
				[
					'**/*',
					'!' + paths.node,
					'!' + paths.node + '/**',
					'!' + paths.dev,
					'!' + paths.dev + '/**',
					'!' + paths.dist,
					'!' + paths.dist + '/**',
					'!' + paths.distprod,
					'!' + paths.distprod + '/**',
					'!' + paths.sass,
					'!' + paths.sass + '/**',
					'!' + paths.composer,
					'!' + paths.composer + '/**',
					'!+(readme|README).+(txt|md)',
					'!*.+(dist|json|js|lock|xml)',
					'!CHANGELOG.md',
				],
				{ buffer: true }
			)
			.pipe( gulp.dest( paths.dist ) );
	} )
);

/**
 * Deletes all files inside the dist-product folder and the folder itself.
 *
 * Run: gulp clean-dist-product
 */
gulp.task( 'clean-dist-product', function() {
	return del( paths.distprod );
} );

// Run
// gulp dist-product
// Copies the files to the /dist-prod folder for distribution as theme with all assets
gulp.task(
	'dist-product',
	gulp.series( [ 'clean-dist-product' ], function() {
		return gulp
			.src( [
				'**/*',
				'!' + paths.node,
				'!' + paths.node + '/**',
				'!' + paths.composer,
				'!' + paths.composer + '/**',
				'!' + paths.dist,
				'!' + paths.dist + '/**',
				'!' + paths.distprod,
				'!' + paths.distprod + '/**',
			] )
			.pipe( gulp.dest( paths.distprod ) );
	} )
);

// Run
// gulp compile
// Compiles the styles and scripts and runs the dist task
gulp.task( 'compile', gulp.series( 'styles', 'scripts', 'dist' ) );

// Run:
// gulp
// Starts watcher (default task)
gulp.task( 'default', gulp.series( 'watch' ) );
