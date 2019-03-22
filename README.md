# AHM API

A Node.js/Express app that provides a set of RESTful endpoints for using the DE Search Engine search based on 
Lucidworks Fusion

### Features

*   Uses Express 4.x to provide stateless RESTful endpoints supporting JSON and XML responses
*   All public facing services use HTTP GET or POST (post is used for large Solr query payloads)
*   Hierarchical application configuration file scheme provided by node-config  
*   Endpoints are mounted using JSON definition files
*   Fusion/Solr queries are defined using JSON definition files
*   All client services function anonymously. No user authentication or authorization required.
*   Only prerequisite for usage is to include a recognized application Id using:
    *   Custom HTTP Request Header **X-Application-Id**
    *   Query parameter **app-id**

### Installation Prerequisites
1.  Node 4.x LTS - currently v4.4.7
2.  Following packages installed globally:
    *   npm install -g gulp
    *   npm install -g pm2
    
### Developer Installation

1.  Clone the search-api development branch:
    *   git clone -b develop https://jw7618@codecloud.web.att.com/scm/st_desearch/search-api.git
2.  cd into "search-api" directory and:
    *  Run "npm install"
    *  Run "gulp unit-test". These unit tests should all run successfully
    
### Developer Configuration
The app comes pre-configured to search a set of pre-defined Fusion collections using the Fusion Query Pipeline API.
These searches are defined as follows:  
*   Uses development Fusion instance <http://zld02478.vci.att.com:8764> 
*   Search API app uses port 8080   
*   Supports search URIs:   
    *   http://localhost:8080/auto-suggest?q={search terms}     
    *   http://localhost:8080/global-search?q={search terms}     
    *   http://localhost:8080/mobile?q={search terms}     
    *   http://localhost:8080/promotions?q={search terms}   
      
### Naming Conventions

#### File naming
I've chosen to use foo-bar instead of fooBar for file and directory names. Reasoning is very simple.
On Mac and Windows fooBar and foobar are recognized as the same file. So on these platforms I can
require('fooBar') with the actual file name 'foobar' and everything will be fine. Deploy this to
Linux and it breaks. So to prevent this I've chosen to use "-" to separate words in file and dir
names. Note that "_" works as well. I just happen to like "-".

### Reading json logs

> cat ./logs/search.log | ./node_modules/.bin/bunyan
  





