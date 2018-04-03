/*
 * Author: Joey Whelan
 * Desc:  Class for sending bot queries to Google DialogFlow.  
 */

'use strict';

class DFlow {

	constructor(token) {
		this.token = token;
		this.url = 'https://api.dialogflow.com/v1/query?v=20170712';
		this.contexts = [];
		this.sessionId = DFlow.uuidv4();
	}
	
	//copied from thread on Stackoverflow
	static uuidv4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		    return v.toString(16);
		 });
	}
	
	send(text) {
		const body = {'contexts': this.contexts,
						'query': text,
						'lang': 'en',
						'sessionId': this.sessionId
		};
		
		return fetch(this.url, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {'Content-Type' : 'application/json','Authorization' : 'Bearer ' + this.token},
			cache: 'no-store',
			mode: 'cors'
		})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			if (data.status && data.status.code == 200) {
				this.contexts = data.result.contexts;
				return data.result.fulfillment.speech;
			}
			else {
				throw data.status.errorDetails;
			}
		})
		.catch(err => { 
			console.error(err);
			return 'We are experiencing technical difficulties.  Please contact an agent.';
		})	
	}
}
