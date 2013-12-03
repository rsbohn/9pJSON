module.exports = function(grunt){
    grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      files: ['*_test.js']
    },
    concat: {
      dist: {
	options: {
	    banner: "//grunt-contrib-concat made this\n"
	},
	files: {
	    'ixp.all.js':  ['ixp.js', 'ixputil.js']
	}
       }
    },
    jshint: {
        files: ['Gruntfile.js', '*.js'],
    },
    watch: {
        files: ['<%= jshint.files %>'],
        tasks: ['jshint','nodeunit']
    }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('test', ['jshint','nodeunit']);
    grunt.registerTask('default', ['jshint','nodeunit']);
};
