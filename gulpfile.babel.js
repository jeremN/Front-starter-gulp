import Gulp 				from 'gulp'
import Browsersync	from 'browser-sync'
import Cache 				from 'gulp-cache'
import Plumber 			from 'gulp-plumber'
import Uglify				from 'gulp-uglify'
import Rename				from 'gulp-rename'
import Concat				from 'gulp-concat'
import Sourcemaps		from 'gulp-sourcemaps'
import Iconfont 		from 'gulp-iconfont'
import Iconfontcss 	from 'gulp-iconfont-css'
import Sass 				from 'gulp-sass'
import Cssnano 			from 'gulp-cssnano'
import Postcss			from 'gulp-postcss'
import Critical 		from 'critical'
import Autoprefixer from 'autoprefixer'
import Imagemin 		from 'gulp-imagemin'
import Pngquant 		from 'imagemin-pngquant'
import Svgmin				from 'gulp-svgmin'
import Webp					from 'gulp-webp'
import ESlint				from 'gulp-eslint'
import Babel				from 'gulp-babel'

const server = Browsersync.create()
const critical = Critical.stream

const PATHS = {
	html: './*.html',
	sass: './assets/sass/**/*.+(scss|sass)',
	js: {
		all: './assets/js/**/*.js',
		main: './assets/js/app.js',
		vendors: './assets/js/vendors/*.js',
		polyfills: './assets/js/polyfills/*.js',
		transpile: './assets/js/transpiles/'
	},
	img: {
		all: './assets/img/**/*.+(png|jpg|jpeg|gif)',
		webp: './assets/img/**/*.+(png|jpg|jpeg|tiff)',
		svg: './assets/img/**/*.svg'
	},
	fonts: './assets/fonts/'
	icons: {
		src: './assets/icons/*svg',
		target: './assets/sass/base/_icons.scss',
		template: './assets/icons/template/_icons.scss'
	},
	css: './assets/css/',
	dist: {
		dist: './dist/',
		css: './dist/css/',
		assets: '.dist/assets/',
		js: './dist/assets/js/',
		img: './dist/assets/img/',
		webp: './dist/assets/webp/',
		font: './dist/assets/fonts/',
		html: './dist/*.html'
	}
}

//Output sass/scss as css + autoprefix + minify + rename with .min
export function styles() {
	const plugins = [
		Autoprefixer({ browsers: ['last 2 versions'] }),
		Cssnano()
	]

	return gulp.src(PATHS.sass)
		.pipe(Sourcemaps.init())
		.pipe(Plumber({
			errorHandler: (err) => {
				console.log(err)
				this.emit('end')
			}
		}))
		.pipe(Sass({ outputStyle:'expanded' }))
		.pipe(Postcss(plugins))
		.pipe(Sourcemaps.write('.'))
		.pipe(gulp.dest(PATHS.css))
		.pipe(Rename({ suffix: '.min' }))
		.pipe(gulp.dest(PATHS.css))
}

//Optimize img png, jpg, jpeg, gif
export function optimizeImg() {
	return gulp.src(PATHS.img.all)
		.pipe(Cache(Imagemin({
			interlaced: true,
			progressive: true,
			use: [Pngquant()]
		})))
		.pipe(gulp.dest(PATHS.dist.img))
}

//Optimize svg
export function optimizeSvg() {
	return gulp.src(PATHS.img.svg)
		.pipe(Svgmin())
		.pipe(gulp.dest(PATHS.dist.img))
}

//Convert img png, jpeg, jpg, tiff to webp
export function convertImgToWebp() {
	return gulp.src(PATHS.img.webp)
		.pipe(webp())
		.pipe(gulp.dest(PATHS.dist.webp))
}

//Export html to /dist
export function copyHtml() {
	return gulp.src(PATHS.html)
		.pipe(gulp.dest(PATHS.dist.dist))
}

//Export fonts to /dist
export function copyFont() {
	return gulp.src(PATHS.fonts)
		.pipe(gulp.dest(PATHS.dist))
}

//Export css to /dist
export function copyCss() {
	return gulp.src(PATHS.css)
		.pipe(gulp.dest(PATHS.dist))
}

//Reload browser sync server
export function reload(done) {
	server.reload()
	done()
}

//Init browser sync server
export function serve(done) {
	server.init({
		server: {
			baseDir: './build/html/'
		}
	})
	done()
}

//Transform svg in /icons into an icon font
export function iconFont() {
	return gulp.src(PATHS.icons)
		.pipe(Iconfontcss({
			fontName: 'icons',
			path: PATHS.icons.template
			targetPath: PATHS.icons.target,
			fontPath: PATHS.fonts
		}))
		.pipe(iconfont({
			fontName: 'icons',
			formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'],
			normalize: true,
			fontHeight: 1001
		}))
		.pipe(gulp.dest(PATHS.fonts))
}

//Minify javascript
export function minifyJs() {
	return gulp.src(PATHS.js.main)
		.pipe(Rename({suffix: '.min'}))
		.pipe(Uglify())
		.pipe(gulp.dest(PATHS.dist.js))
}

//Concat javascript vendors
export function concatJs() {
	return gulp.src([ PATHS.js.vendors, PATHS.js.polyfills ])
		.pipe(Sourcemaps.init())
		.pipe(Concat('concat.js'))
		.pipe(Sourcemaps.write())
		.pipe(gulp.dest(PATHS.dist.js))
}

//Transpile es6 -> es5
export function toES5() {
	return gulp.src(PATHS.js.all)
		.pipe(Sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(Sourcemaps.write())
		.pipe(gulp.dest(PATHS.js.transpile))
}

//Lint javascript
export function lintJs() {
	return gulp.src(PATHS.js)
		.pipe(ESlint())
		.pipe(ESlint.format())
		.pipe(ESlint.failAfterError())
}

//Delete /dist
export function clean() {
	del(['dist'])
}

//Output critical css
export function criticalCss() {
	return gulp.src(PATHS.dist.html)
		.pipe(critical({
			base: PATHS.dist.dist,
			inline: true,
			css: [PATHS.dist.css]
		}))
		.on('error', (err) => { log.error(err.message) })
		.pipe(gulp.dest(PATHS.dist.dist))
}

//Gulp watch change
export function watch() {
	gulp.watch(PATHS.sass, gulp.series(styles, iconFont))
	gulp.watch(PATHS.js, gulp.series(lintJs))
}

//Js Tasks
gulp.task('concat', 
	gulp.series(concatJs))
gulp.task('transpil', 
	gulp.series(toES5))


//Build & dev Tasks
gulp.task('build', 
	gulp.series(clean, optimizeImg, optimizeSvg, convertImgToWebp, styles, copyHtml, copyFont, copyCss, minifyJs, criticalCss))

gulp.task('dev', 
	gulp.series(iconFont, styles, gulp.parallel(watch))

