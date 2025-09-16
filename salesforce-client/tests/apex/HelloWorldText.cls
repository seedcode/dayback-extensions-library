// Simple Apex REST service that responds to GET and POST requests
// GET returns {"message":"Hello world"}
// POST with {"name":"SalesforceClient"} returns {"message":"Hey SalesforceClient"}
// If no name is provided, defaults to "world"

@RestResource(urlMapping='/HelloWorld/*')
global with sharing class HelloWorldText {
    @HttpGet
    global static void hello() {
        RestContext.response.addHeader('Content-Type', 'application/json; charset=UTF-8');
        RestContext.response.statusCode = 200;
        RestContext.response.responseBody = Blob.valueOf('{"message":"Hello world"}');
    }

    @HttpPost
    global static void helloPost() {
        String name = 'world'; // default if not provided
        try {
            if (RestContext.request != null && RestContext.request.requestBody != null) {
                String body = RestContext.request.requestBody.toString();
                Object parsed = System.JSON.deserializeUntyped(body);
                if (parsed instanceof Map<String, Object>) {
                    Object n = ((Map<String, Object>)parsed).get('name');
                    if (n != null) name = String.valueOf(n);
                }
            }
            // Build JSON safely
            Map<String, Object> resp = new Map<String, Object>{ 'message' => 'Hey ' + name };
            RestContext.response.addHeader('Content-Type', 'application/json; charset=UTF-8');
            RestContext.response.statusCode = 200;
            RestContext.response.responseBody = Blob.valueOf(System.JSON.serialize(resp));
        } catch (Exception e) {
            // Simple 400 on bad payload
            Map<String, Object> err = new Map<String, Object>{ 'message' => 'Bad Request' };
            RestContext.response.addHeader('Content-Type', 'application/json; charset=UTF-8');
            RestContext.response.statusCode = 400;
            RestContext.response.responseBody = Blob.valueOf(System.JSON.serialize(err));
        }
    }
}

