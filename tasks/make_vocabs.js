module.exports = function (grunt) {
    grunt.config('cloudfile_to_vocab', {
        default: {
            options: {
                output_directory:      'source/vocabs',
                google_spreadsheet_id: '<%= env.google.translation.newsspec_7103[0].spreadsheetId %>',
                worksheet:             '<%= env.google.translation.newsspec_7103[0].worksheetId %>',
                username:              '<%= env.google.username %>',
                password:              '<%= env.google.password %>'
            }
        }
    });
    grunt.loadNpmTasks('grunt-cloudfile-to-vocab');
    grunt.registerTask('make_vocabs', ['add_environment_data', 'cloudfile_to_vocab']);
};