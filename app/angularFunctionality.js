var app = angular.module("mainModule",[]);

const OAUTH_CONSUMER_KEY = 'oZdRqVw_uUHAkauNOqCAkg';
const OAUTH_TOKEN = 'jQ5SikcD7evOOmXm4zxeeaPooMQoKQsY';
const OAUTH_SIGNATURE_METHOD = 'HMAC-SHA1';
const OAUTH_SIGNATURE = 'BRwpmyCL616zCCbrlhLRa1CLSx0';


app.controller('SplashController',['$http','$location',function($http,$location){
    var topScope=this;
    this.searchResults=[];
    this.searchLocation="";
    this.currentUserID;
    this.loggedIn=false;
    this.hasCachedData=false;
    this.storedTerm;
    var searchTerm;
    
    $('#searchBox').keydown(function(event){
        if(event.keyCode == 13){
            $("#searchSubmit").click();
        }
    });
    
    this.triggerYelpSearch = function triggerYelpSearch(searchLocation){
        console.log("search location: "+searchLocation);
        $http.post('/',{searchLocation:searchLocation})
            .then(function successCallback(response){
                logYelpResults(response.data);
            }),(function errorCallback(response){
                console.log('error with response');
            });
    }
    
    this.loginWithFacebook = function loginWithFacebook(){
        console.log('trying to get into button');
        $http.get('/auth/facebook',{searchLocation:this.searchLocation})
            .then(function successCallback(response){
               console.log('logged in with facebook'); 
            }),(function errorCallback(response){
                
            });
    }
    
    
    function logYelpResults(data){
        topScope.searchResults=[];
        for(var i=0;i<data.businesses.length;i++){
            var businessName=data.businesses[i].name;
            var snippetText=data.businesses[i].snippet_text;
            var thumbnailImage=data.businesses[i].image_url;
            var id=data.businesses[i].id;
            var numPplGoing=data.businesses[i].numPplGoing;
            var currentUserID=data.currentUserID;
            var currentUserGoing;
            if(currentUserID){
                currentUserGoing=checkIfCurrentUserIsGoingToVenue(currentUserID,data.businesses[i]);
            }else{
                currentUserGoing=false;
            }
            var businessObject = {name:businessName,textSnippet:snippetText,thumbnailImage:thumbnailImage,numPplGoing:numPplGoing,going:currentUserGoing,id:id};
            topScope.searchResults.push(businessObject);
        }
    }
    
    function checkIfCurrentUserIsGoingToVenue(currentUserID,business){
        for(var i=0;i<business.pplGoing.length;i++){
            if(currentUserID.toString()===business.pplGoing[i]) return true;
        }
        return false;
    }
    
    this.init = function init(passedInTerm){
        console.log('this is the passed in term: '+JSON.stringify(passedInTerm));
        this.loggedIn=passedInTerm.loggedIn;
        if(passedInTerm.savedSearch){
            this.triggerYelpSearch(passedInTerm.savedSearch);
        }
    }
    
    this.toggleGoing = function toggleGoing(yelpEntry){
         var postingType;
         var id=yelpEntry.id;
         
         yelpEntry.going=!yelpEntry.going;
         if(yelpEntry.going===true){
             postingType='increment';
             yelpEntry.numPplGoing++;
         }else{
             postingType='decrement';
             yelpEntry.numPplGoing--;
         }
         
        //  console.log('yelpEntry: '+JSON.stringify(yelpEntry));
         $http.put('/',{postingType:postingType,id:id})
            .then(function successCallback(response){
                console.log(postingType+" at "+id);
            }),(function failureCallback(response){
                console.log('there was a problem changing the number of people going: '+response);
            });
    }
    
    
}]);
