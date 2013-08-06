describe('OTP.models', function() {
    var server;

    beforeEach(function() {
        //server = sinon.fakeServer.create();
    });

    afterEach(function() {
        //server.restore();
    });

    describe('OtpPlanRequest', function() {

        it('make a request', function(done) {

            // need to spoof json-p/ajex request to inject resutls
            var responseObj = helpers.testResponse;
            sinon.stub($, 'ajax').returns({done: sinon.stub().callsArgWith(0, responseObj)})

            var requestModel = new OTP.models.OtpPlanRequest(helpers.testRequest, {urlRoot: '/test'});
            
            requestModel.on('success', function(response){
                done();
            });

            requestModel.request();

            
        }); 
    });
});
