/*
 * Author: Joey Whelan
 * Desc:  Google Cloud Function (GCF) for validating user inputs to a chat bot.  
 */

'use strict';

const https = require('https');
const FIREWOOD_TYPES = ['split', 'logs'];
const DELIVERY_ZIP = '80863';
const PRICE_PER_CORD = {'split' : 200, 'logs' : 150};
const AUTH_ID = 'yourid';
const AUTH_TOKEN = 'yourtoken';

function callStreetApi(street) {
	return new Promise((resolve, reject) => {
		const options = {
				hostname: 'us-street.api.smartystreets.com',
				path: '/street-address?auth-id=' + AUTH_ID + '&auth-token=' + AUTH_TOKEN + '&street=' + encodeURIComponent(street) + '&zipcode=' + DELIVERY_ZIP,
				port: 443,
				headers: {
					'Content-Type': 'application/json',
					'Host': 'us-street.api.smartystreets.com' 
				}
		}
		https.get(options, (res) => {
			let body = '';
			res.on('data', (d) => { body += d; });
			res.on('end', () => {
				const response = JSON.parse(body);
				if (response && response.length > 0) {
					const msg = 'We can schedule delivery from tomorrow up to a month from now between 9 am and 5 pm.  ' +
					'What date and time do you want delivery?';
					const output = JSON.stringify({"speech": msg, "displayText": msg});
					resolve(output);
				}
				else {
					const output = JSON.stringify ({"followupEvent" : {"name":"requerystreet", "data":{}}});
					resolve(output);
				}
					
			});
			res.on('error', (error) => {
				console.error('Error: ' + error);
				const output = JSON.stringify ({"followupEvent" : {"name":"requestagent", "data":{}}});
				resolve(output);				
			});
		});
	});
}

function validate(data) { 
	console.log('validate: data.intentName - ' + data.metadata.intentName);
	switch (data.metadata.intentName) {
		case '3.0_getNumberCords':
			const cords = data.parameters.numberCords;
			if (cords && cords > 0 && cords < 4) {
				return new Promise((resolve, reject) => {
					const msg = 'We deliver within the 80863 zip code.  What is your street address?';
					const output = JSON.stringify({"speech": msg, "displayText": msg});
					resolve(output);
				});
			}
			else {
				return new Promise((resolve, reject) => {
					const output = JSON.stringify ({"followupEvent" : {"name":"requerynumbercords", "data":{}}});
					resolve(output);
				});
			}
			break;
		case '4.0_getStreet':
			const street = data.parameters.deliveryStreet;
			if (street) {
				return callStreetApi(street);
			}
			else {
				return new Promise((resolve, reject) => {
					const output = JSON.stringify ({"followupEvent" : {"name":"requerystreet", "data":{}}});
					resolve(output);
				});
			}
			break;
		case '5.0_getDeliveryTime':
			const dt = new Date(Date.parse(data.parameters.deliveryTime));
			const now = new Date();
			const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
			const monthFromNow = new Date(now.getFullYear(), now.getMonth()+1, now.getDate());
			if (dt && dt.getUTCHours() >= 9 && dt.getUTCHours() <= 17 && dt >= tomorrow && dt <= monthFromNow) {
				return new Promise((resolve, reject) => {
					const contexts = data.contexts;
					let context = {};
					for (let i=0; i < contexts.length; i++){
						if (contexts[i].name === 'ordercontext') {
							context = contexts[i];
							break;
						}
					}
					const price = '$' + PRICE_PER_CORD[context.parameters.firewoodType] * context.parameters.numberCords;
					const msg = 'Thanks, your order for ' + context.parameters.numberCords + ' cords of ' + context.parameters.firewoodType + ' firewood ' + 
				    'has been placed and will be delivered to ' + context.parameters.deliveryStreet + ' at ' + context.parameters.deliveryTime + '.  ' + 
				    'We will need to collect a payment of ' + price + ' upon arrival.';
					const output = JSON.stringify({"speech": msg, "displayText": msg});
					resolve(output);
				});
			}
			else {
				return new Promise((resolve, reject) => {
					const output = JSON.stringify ({"followupEvent" : {"name":"requerydeliverytime", "data":{}}});
					resolve(output);			
				});
			}
			break;
		default:  //should never get here
			return new Promise((resolve, reject) => {
				const output = JSON.stringify ({"followupEvent" : {"name":"requestagent", "data":{}}});
				resolve(output);		
			});
	}
}
	
function firewoodWebhook (req, res) {
  	console.log("Request:", JSON.stringify(req.body,null,4)); 
    validate(req.body.result).then((output) => {
    	console.log('output: ' + output);
    	res.setHeader('Content-Type', 'application/json');
    	res.send(output);
    }).catch((error) => {
    	res.setHeader('Content-Type', 'application/json');
    	res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
}

exports.firewoodWebhook = firewoodWebhook;
