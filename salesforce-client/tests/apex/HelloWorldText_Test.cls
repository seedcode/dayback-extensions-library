// Simple test class for HelloWorldText Apex REST service
// Note: Salesforce requires at least one test method in each class
// to deploy to production, and that test methods cover at least 75% of the code
// in the class. This test class covers both the GET and POST methods.

@IsTest
private class HelloWorldText_Test {
    @IsTest
    static void testHelloWorldText_get() {
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/HelloWorld';
        req.httpMethod  = 'GET';

        RestResponse res = new RestResponse();
        RestContext.request  = req;
        RestContext.response = res;

        Test.startTest();
        HelloWorldText.hello();
        Test.stopTest();

        System.assertEquals(200, RestContext.response.statusCode, 'Should return HTTP 200');
        String body = RestContext.response.responseBody.toString();
        Map<String, Object> parsed = (Map<String, Object>) System.JSON.deserializeUntyped(body);
        System.assertEquals('Hello world', (String) parsed.get('message'));
    }

    @IsTest
    static void testHelloWorldText_post() {
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/HelloWorld';
        req.httpMethod  = 'POST';
        req.addHeader('Content-Type', 'application/json');
        req.requestBody = Blob.valueOf('{"name":"Michael"}');

        RestResponse res = new RestResponse();
        RestContext.request  = req;
        RestContext.response = res;

        Test.startTest();
        HelloWorldText.helloPost();
        Test.stopTest();

        System.assertEquals(200, RestContext.response.statusCode, 'POST should return HTTP 200');
        String body = RestContext.response.responseBody.toString();
        Map<String, Object> parsed = (Map<String, Object>) System.JSON.deserializeUntyped(body);
        System.assertEquals('Hey Michael', (String) parsed.get('message'));
    }
}
