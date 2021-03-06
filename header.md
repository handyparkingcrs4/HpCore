For more info about the project, please visit the [HandyParking official website](http://handyparking.crs4.it)

Security & Authentication
-------------------------
All API endpoints use **HTTPS** protocol.

All API endpoints **MUST require authentication**.



Thus, you MUST obtain an API token and use it in HTTP header, as in:

    Authentication: Bearer <API_TOKEN>

or appending a URL parameter as in:

    /parkings?access_token=<API_TOKEN>

***

Pagination
-------------------------

All endpoints providing a listing functionality, like `/parkings`, returns paginated responses.
Pagination information is always provided using the following format:

    ...
    "_metadata":{
                    "skip":10,
                    "limit":50,
                    "totalCount":1500
                }


