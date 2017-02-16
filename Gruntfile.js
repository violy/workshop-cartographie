module.exports = function(grunt) {

    grunt.initConfig({
        bowercopy: {
            options: {
                // Task-specific options go here
            },
            vendors: {
                // Target-specific file lists and/or options go here
                options:{
                    destPrefix:'public/vendors'
                },
                files:{
                    'jquery.min.js':'jquery/dist/jquery.min.js',
                    'leaflet':'leaflet/dist',
                    '_reset.scss':'reset-css/_reset.scss'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bowercopy');

    grunt.registerTask('default', ['bowercopy']);

};