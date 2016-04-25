## This little file provides some twitter like status update APIs using restify and mongoose

## For throttling

- Use restify build-in method restify.throttle() to limit using of resource by IP

## For security 

-Use restify-oauth2 to authenticate the identity of the user. If user is identified req.clientId will not be set to the id of that user, if not req.clientId will be undefined

-Use bcrypt to hash and add salt to user's password(assume user's password is not hashed in 
client-side)

-request to /user METHOD - post will only be accepted through https

## For validation 

-Use Joi to validate the input provided by user

## For content negotiation 

-supported response content-type: yaml/json/text

## Some areas for further improvements

-for some conditional requests to get info from /users/:userid/tweets or /user
if request contains if-none-match/if-not-modified header when conditions match return 304 not modified to save the time of further processing the request 

