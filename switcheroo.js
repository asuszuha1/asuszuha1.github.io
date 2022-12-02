

(function(window){
    Switcheroo = function(params) {

        // start in closed state
        this.isOpen = false;

        // load user data
        this.optionData = params.data;
        this.params = {
            data: [],
            keyBindings: {
                open: ['Control','Shift','F'],
                close: ['Escape']
            },
            text: {
                closeButton: 'Close',
                searchField: 'Start Typing...'
            },
            showCategories: true,
            prioritizeCategoricalSort: true,
            closeOnSelect: true,
            caseSensitive: false
        };

        function setUserParams(defaultParams, userParams) {
              for (var params in userParams) {
                  if (userParams[params].constructor == Object) {
                      if (defaultParams[params]) {
                          setUserParams(defaultParams[params], userParams[params]);
                          continue;
                      }
                  }
                  defaultParams[params] = userParams[params];
              }
            };

        setUserParams(this.params, params);

        // Switcheroo Container
        var switcherooContainer = document.createElement('div');
        switcherooContainer.setAttribute('id', 'switcheroo');
        switcherooContainer.style.display = 'none';
        this.switcherooContainer = switcherooContainer;
        document.body.appendChild(this.switcherooContainer);

        // Escape button
        var removalButton = document.createElement('button');
        removalButton.setAttribute('id', 'switcheroo-removebutton');
        removalButton.innerHTML = 'Close';
        removalButton.onclick = function() { this.close(); }.bind(this);
        this.removalButton = removalButton;
        this.switcherooContainer.appendChild(removalButton);

        // Search Container
        var searchContainer = document.createElement('div');
        searchContainer.setAttribute('id', 'switcheroo-container');
        this.searchContainer = searchContainer;
        this.switcherooContainer.appendChild(searchContainer);

        // Search Field
        var searchField = document.createElement('input');
        searchField.setAttribute('type', 'text');
        searchField.setAttribute('id', 'switcheroo-field');
        searchField.setAttribute('placeholder', 'Start typing...');
        searchField.oninput = this.onFieldInput;
        this.searchField = searchField;
        this.searchContainer.appendChild(this.searchField);
        this.searchField.focus();

        // Search Results
        var searchResults = document.createElement('div');
        searchResults.setAttribute('id', 'switcheroo-results');
        this.searchResults = searchResults;
        this.searchContainer.appendChild(this.searchResults);
        this.registerKeyPresses();

        // Return Switcheroo object
        return this;
    };

    Switcheroo.prototype.open = function() {
        // Check if open
        if(!this.isOpen) {
            // Open
            this.switcherooContainer.style.display = 'unset';
            this.isOpen = true;
            this.searchField.focus();
        }
    };

    Switcheroo.prototype.close = function() {
        // Check if closed
        if(this.isOpen) {
            // Close
            this.switcherooContainer.style.display = 'none';
            this.isOpen = false;
            this.searchField.value = '';
            this.updateSearchResults();
        }
    };

    Switcheroo.prototype.isOpen = function() {
        return this.isOpen;
    };

    Switcheroo.prototype.onFieldInput = function(evt) {
        Switcheroo.updateSearchResults(evt.target.value);
    };

    Switcheroo.prototype.updateSearchResults = function(result) {

        var sortResults = function(resultList) {
            var sortByName = function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            }
            var sortByCategory = function(a, b) {
                if (a.category < b.category) {
                    return -1;
                }
                if (a.category > b.category) {
                    return 1;
                }
                return 0;
            }

            var sortedResultList = resultList.sort(sortByName);
            if (this.params.showCategories && this.params.prioritizeCategoricalSort) {
                sortedResultList = sortedResultList.sort(sortByCategory);
            }
            return sortedResultList;

        }.bind(this);

         this.searchResults.innerHTML = '';
         this.currentSearchResults = [];
         if (!result || result === '') { return; }
         var resultList = this.optionData.filter(function(option, index) {
            var optionName = !this.params.caseSensitive ? option.name.toLowerCase() : option.name;
            var optionCategory = !this.params.caseSensitive ? option.category.toLowerCase() : option.category;
            var typedResult = !this.params.caseSensitive ? result.toLowerCase() : result;

            return optionName.startsWith(typedResult) || (this.params.showCategories && optionCategory.startsWith(typedResult));
         }.bind(this));

         resultList = sortResults(resultList);

        resultList.forEach(function(option, index){
            var newOption = document.createElement('label');
            newOption.className += 'switcheroo-option';
            this.setSelectedResult(0);
            newOption.innerHTML = (this.params.showCategories ? option.category + ': ' : '') + option.name;

            var resultObj = { element: newOption, option: option }
            newOption.onclick = function() {
                this.currentlySelectedResult = resultObj;
                this.selectResult();
            }.bind(this);

            this.searchResults.appendChild(newOption);
            this.currentSearchResults.push(resultObj);
        }.bind(this));
    };

    Switcheroo.prototype.getData = function() {
        return this.optionData;
    };

    Switcheroo.prototype.registerKeyPresses = function() {
        // Map open/close combos
        if(!this.keyBindingMap) this.keyBindingMap = {};
        document.onkeydown = function(evt) {
            evt = evt || window.event;

            this.keyBindingMap[evt.key] = true;

            // Register open command
            if(!this.isOpen){
                var openCombo = this.params.keyBindings.open;
                var isSatisfied = openCombo.every(function(key) {
                    return (key in this.keyBindingMap && this.keyBindingMap[key] === true);
                }.bind(this));
                if(isSatisfied) {
                    this.open();
                }
            }
            // Register close command
            else {
               var closeCombo = this.params.keyBindings.close;
               var isSatisfied = closeCombo.every(function(key) {
                    return (key in this.keyBindingMap && this.keyBindingMap[key] === true);
               }.bind(this));
               if(isSatisfied) {
                    this.close();
               }
            }
        }.bind(this);
        document.onkeyup = function(evt) {
            evt = evt || window.event;
            if(evt.key in this.keyBindingMap) {
                this.keyBindingMap[evt.key] = false;
            }

            if(!this.isOpen) { return; }

            switch (evt.key) {
                // Enter for submit
                case 'Enter':
                    this.selectResult();
                    break;
                // Arrow keys for navigation
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    this.navigate(evt.key);
                    break;
                default:
                    this.autoFocusField(evt);
            }
        }.bind(this);
    }

    Switcheroo.prototype.autoFocusField = function(keyEvent) {
        var pressProducesCharacter = function(evt) {
            if (typeof evt.which == "undefined") {
                return true;
            } else if (typeof evt.which == "number" && evt.which > 0) {
                return !evt.ctrlKey
                        && !evt.metaKey
                        && !evt.altKey
                        && evt.which != 8
                        && evt.key.length === 1;
            }
            return false;
        };

        if(!pressProducesCharacter(keyEvent)) { return; }

        var activeElement = document.activeElement;

        if (this.searchField === activeElement) {
            return;
        }

        var currentValue = this.searchField.value;

        this.searchField.value += keyEvent.key;
        this.searchField.focus();
        this.updateSearchResults(this.searchField.value);
    }

    Switcheroo.prototype.navigate = function(direction) {
       // Get the list of elements
       var elementList = this.currentSearchResults;
       // Get min/max/position
       var position = -1;
       var min = 0;
       var max = elementList.length - 1;
       // Check if any are highlighted
       elementList.forEach(function(option, index) {
            if(option.element.classList.contains('switcheroo-selected')) {
                position = index;
            }
       });
       // Execute direction change
       switch(direction) {
            case "ArrowDown":
                this.setSelectedResult(position !== max ? position + 1 : 0);
                break;
            case "ArrowUp":
                this.setSelectedResult(position > 0 ? position - 1 : elementList.length - 1);
                break;
       }
    }

    Switcheroo.prototype.setSelectedResult = function(position) {

        function scrollToElem(elem, parent) {

            var elementTopCoord = elem.getBoundingClientRect().top;
            var elementBottomCoord = elem.getBoundingClientRect().bottom;

            var parentTopCoord = parent.getBoundingClientRect().top;
            var parentBottomCoord = parent.getBoundingClientRect().bottom;

            var isInView = elementTopCoord >= parentTopCoord && elementBottomCoord <= parentBottomCoord;

           if (elem && elem.scrollIntoView && !isInView) {
               elem.scrollIntoView();
           }
        }

        var elementList = this.currentSearchResults;

        if(position < 0) {
            // Remove highlight
        } else if (position >= elementList.length) {
            // Handle end of list
        } else {
            // Remove current selected result
            elementList.forEach(function(option) {
                if(option.element.classList.contains('switcheroo-selected')) {
                    option.element.classList.remove('switcheroo-selected');
                }
            });
            // Set new selected result
            elementList[position].element.classList.add('switcheroo-selected');
            scrollToElem(elementList[position].element, this.searchResults);
            this.currentlySelectedResult = elementList[position];
        }
    }

    Switcheroo.prototype.selectResult = function() {
        var result = this.currentlySelectedResult;
        if(!result) {return;}

        // Call action is exists and is function
        var functionCheck = {};
        if(result.option.action && functionCheck.toString.call(result.option.action === '[object Function]')) {
            result.option.action(result.option);
        }

        if(this.params.closeOnSelect) {
            this.close();
        }
    }

})(window);
