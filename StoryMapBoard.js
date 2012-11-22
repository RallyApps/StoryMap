function StoryMapBoard() {
    var themeDropdown,storyBoardDiv,tag,newThemeNameInput,cardboard,columnStates,tagName = "Theme";
    var that = this;
    var rallyDataSource = new rally.sdk.data.RallyDataSource('__WORKSPACE_OID__',
            '__PROJECT_OID__',
            '__PROJECT_SCOPING_UP__',
            '__PROJECT_SCOPING_DOWN__');

    this._onError = function(response) {
        var errors = response.Errors;

        if (response.Errors.length > 0) {
            msg = errors[0];
            msg = msg.replace(/HierarchicalRequirement/gi, "Story");
            if (msg.search(/should not be null/gi) > 0) {
                msg += " This is a Rally Labs app. " +
                        "Rally may consider supporting required fields in the future.";
            }
            rally.sdk.ui.AppHeader.showMessage("error", msg, 5000);
            rally.Logger.warn(msg);
        }
    };

    this._createStoryAsTheme = function() {
        function success() {
            that.refreshBoard();
        }

        rallyDataSource.create("HierarchicalRequirement", {
            Name:newThemeNameInput.value,
            Tags:[tag]
        }, success, that._onError, {
            rankTo: "Bottom"
        });
    };

    this._itemAddEvent = function() {
        if (themeDropdown && themeDropdown.getValue() === "New Theme") {
            that._addTaggedStory();
        }
        else {
            that.createChildStory(themeDropdown.getValue());
        }
    };

    this.createChildStory = function(parentRef) {
        function success() {
            that.refreshBoard();
        }

        rallyDataSource.create("HierarchicalRequirement", {
            Name:newThemeNameInput.value,
            Parent:parentRef
        }, success, that._onError, {
            rankTo: "Bottom"
        });
    };

    this._addTaggedStory = function() {

        function getThemeTag(callback) {
            function createNewTag(callback) {
                rallyDataSource.create("Tag", {Name:tagName}, callback);
            }

            function retrieveOrCreateTag(results) {
                if (results.tag.length > 0) {
                    tag = results.tag.pop();
                    callback();
                }
                else {
                    rallyDataSource.create("Tag", {Name:tagName}, function (ref) {
                        tag = {_ref:ref};
                        callback();
                    });
                }
            }

            rallyDataSource.find({
                key:"tag",
                type:"Tag",
                query: "(Name = \"" + tagName + "\")"
            }, retrieveOrCreateTag);
        }

        if (tag) {
            that._createStoryAsTheme();
        }
        else {
            getThemeTag(that._createStoryAsTheme);
        }
    };

    this._setBoardData = function(data) {
        dojo.forEach(data.ChildStories, function(story) {
            story.Parent = rally.sdk.util.Ref.getRelativeRef(story.Parent._ref);
        });

        var cardboardConfig = {
            types: ["HierarchicalRequirement"],
            attribute: "Parent",
            sortAscending: true,
            order: "Rank",
            columns:columnStates,
            items: data.ChildStories,
            maxColumnsPerBoard:20,
            cardRenderer:SimpleCardRenderer,
            columnRenderer: StoryMapBoardColumnRenderer
        };

        if (!cardboard) {
            cardboard = new rally.sdk.ui.CardBoard(cardboardConfig, rallyDataSource);
            cardboard.display("storyBoard");
        } else {
            cardboard.refresh(cardboardConfig);
        }
    };

    this._displayBoard = function() {
        var childQuery = {
            key: "ChildStories",
            type: "HierarchicalRequirement",
            fetch: "Name,FormattedID,Owner,ObjectID,Rank,Parent",
            query: "(Parent.Tags.Name Contains \"" + tagName + "\")",
            order: "Rank"
        };
        rallyDataSource.findAll(childQuery, that._setBoardData);
    };

    this._displayThemeDropdown = function(themes) {
        var defaultThemeText = "Theme";
        if (themeDropdown && themeDropdown.getDisplayedValue) {
            defaultThemeText = themeDropdown.getDisplayedValue();
            themeDropdown.destroy();
        }
        var data = [
            {label:"Theme",value:"New Theme"}
        ];
        rally.forEach(themes, function(theme) {
            data.push({label:'Child for "' + theme.Name + '"',value:theme._ref});
        });
        var config = {
            defaultDisplayValue:defaultThemeText,
            rememberSelection:false
        };
        themeDropdown = new rally.sdk.ui.basic.Dropdown(config);
        themeDropdown.setItems(data);
        themeDropdown.display("themeDropdown");
    };

    function newStoryInput(pEvent) {
        if (pEvent.keyCode === dojo.keys.ENTER) {
            that._itemAddEvent();
        }
    }

    this.display = function(element) {
        var button = new rally.sdk.ui.basic.Button({text:"Add"});
        button.display("newThemeButton");
        button.addEventListener(button.getValidEvents().onClick, that._itemAddEvent);
        newThemeNameInput = dojo.byId("newThemeName");
        dojo.connect(newThemeNameInput, "onkeyup", newStoryInput);
        newThemeNameInput.focus();
        storyBoardDiv = document.createElement("div");
        storyBoardDiv.id = "storyBoard";
        dojo.addClass(storyBoardDiv, "storyBoard");
        element.appendChild(storyBoardDiv);
        that._createBoard();
    };

    this.refreshBoard = function() {
        that._destroyBoard();
        that._createBoard();
        newThemeNameInput.value = "";
        newThemeNameInput.focus();
    };

    this._createBoard = function() {
        that._getThemes(that._decideBeginningAction);
    };

    this._destroyBoard = function() {
        if (cardboard && cardboard.destroy) {
            cardboard.destroy();
        }
        cardboard = null;
        dojo.empty(storyBoardDiv);
    };

    this._decideBeginningAction = function(themes) {
        if (themes) {
            that._createColumns(themes);
            that._displayThemeDropdown(themes);
        }
        else {
            that._renderDefaultInstructions();
        }

    };

    this._renderDefaultInstructions = function() {
        var instructionsDiv = document.createElement("div");
        dojo.addClass(instructionsDiv, "instructions");

        var instructions = document.createElement("span");
        dojo.addClass(instructions, "quote");
        instructions.innerHTML = "<p>The Story Map helps you build a visual backlog of work based on user activities and goals.</p><p >For example, an auction site might use themes like <em>Create an Auction</em>, <em>Search</em>, and <em>Bid</em>. Each of these consists of many smaller user tasks.</p><p>To start, think of one of the big-picture activities that your product supports, and enter it in the box above.  These themes will be the backbone of your storymap.</p>";
        instructionsDiv.appendChild(instructions);

        var learnMoreLinkElement = document.createElement("a");
        dojo.attr(learnMoreLinkElement, "href", "http://www.agileproductdesign.com/blog/the_new_backlog.html");
        dojo.attr(learnMoreLinkElement, "target", "new");
        learnMoreLinkElement.innerHTML = "Learn more about story maps";
        instructions.appendChild(learnMoreLinkElement);

        var exampleImage = document.createElement("img");
        dojo.attr(exampleImage, "src", "/apps/resources/StoryMap/example-map.png");
        dojo.addClass(exampleImage, "exampleImage");
        instructionsDiv.appendChild(exampleImage);

        dojo.byId("storyBoard").appendChild(instructionsDiv);
    };

    this._createColumns = function(themes) {
        columnStates = {};
        rally.forEach(themes, function(theme, i) {
            columnStates[i] = {
                displayValue:themes[i].Name,
                item:themes[i]
            };
        });
        that._displayBoard();
    };

    this._getThemes = function(callback) {

        var themeQuery = {
            key: "Themes",
            type: "HierarchicalRequirement",
            fetch: "Name,FormattedID,Owner,ObjectID,Rank",
            query: "(Tags.Name Contains " + tagName + ")",
            order: "Rank"
        };

        function processThemesQueryResults(results) {
            var themes = {};
            dojo.forEach(results.Themes, function(theme) {
                themes[rally.sdk.util.Ref.getRelativeRef(theme._ref)] = theme;
            });
            if (results.Themes && results.Themes.length === 0) {
                callback(false);
            }
            callback(themes);
        }


        rallyDataSource.find(themeQuery, processThemesQueryResults);
    };
}
