/*
 * Author: Joey Whelan
 * Desc:  Highly-modified version of the chat.js file included in the cometd vanilla javascript demo.  
 */

'use strict';

window.addEventListener('DOMContentLoaded', function() {
    function getId(id) {
        return document.getElementById(id);
    }

    function empty(element) {
        while (element.hasChildNodes()) {
            element.removeChild(element.lastChild);
        }
    }

    function show(element) {
        var display = element.getAttribute('data-display');
        // Empty string as display restores the default.
        if (display || display === '') {
            element.style.display = display;
        }
    }

    function hide(element) {
        element.setAttribute('data-display', element.style.display);
        element.style.display = 'none';
    }
    
    function displayText(fromUser, text) {
    	var chat = getId('chat');
    	var msg = fromUser + ' ' + text;
    	chat.appendChild(document.createTextNode(msg));
        chat.appendChild(document.createElement('br'));
        chat.scrollTop = chat.scrollHeight - chat.offsetHeight;  
    }
    
    function Chat(mode) {
        var _mode = mode;
    	var _self = this;
        var _firstName;
        var _lastName;
        var _dflow; 
   
        this.start = function(firstName, lastName) {
            _firstName = firstName;
            _lastName = lastName;
            if (!_firstName || !_lastName) {
                alert('Please enter a first and last name');
                return;
            }
            
            /**this is inherently insecure as the key is exposed on the client side.  For a production app
	you'd store the key server-side and proxy the API requests through that server */
            _dflow = new DFlow("yourtoken");
            hide(getId('start'));
            show(getId('started'));
            getId('sendButton').disabled = false;
            getId('phrase').focus();
        };

        this.leave = function() {
        	switch (_mode) {
        		case 'dflow':    			
        			break;
        	}
        	getId('chat').innerHTML = '';
        	show(getId('start'));
            hide(getId('started'));
            getId('firstName').focus();
        };
                       
        this.send = function() {
            var phrase = getId('phrase');
            var text = phrase.value.trim();
            phrase.value = '';

            if (text && text.length > 0) {
            	var fromUser = _firstName + _lastName + ':'; 
            	displayText(fromUser, text);
            
            	switch (_mode) {
            		case 'dflow':
            			_dflow.send(text).then(resp => displayText('Bot:', resp));
            			break;
            	}
            }
        };         
  
        window.onunload = function(){
    		console.log('cleaning up: ' + _mode);
    		switch (_mode) {
    			case 'dflow':    			
    				break;
    		}
        };
    }
    
    var chat = new Chat('dflow');

    // Setup UI
    show(getId('start'));
    hide(getId('started'));
    getId('startButton').onclick = function() {
        chat.start(getId('firstName').value, getId('lastName').value);
    };
    getId('sendButton').onclick = chat.send;
    getId('leaveButton').onclick = chat.leave;
    getId('firstName').autocomplete = 'off';
    getId('firstName').focus();
    getId('lastName').autocomplete = 'off';
    getId('phrase').autocomplete = 'off';
    getId('phrase').onkeyup = function(e) {
        if (e.keyCode === 13) {
            chat.send();
        }
    };
});

