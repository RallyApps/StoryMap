StoryMapBoardColumnRenderer = function(board, value, options) {
    rally.sdk.ui.cardboard.BasicColumnRenderer.call(this, board, value, options);
    var dndContainer;
    var columnDiv;
    var headerRenderer = new SimpleCardRenderer(null, options.item);
    this.render = function() {
        columnDiv = document.createElement("div");
        dojo.addClass(columnDiv, "column");
        var columnHeader = document.createElement("div");
        dojo.addClass(columnHeader, "columnHeader");
        var headerCard = headerRenderer.renderCard();
        dojo.addClass(headerCard, "themeCard");
        columnHeader.appendChild(headerCard);
        columnDiv.appendChild(columnHeader);
        dndContainer = document.createElement("div");
        dojo.addClass(dndContainer, "columnContent");
        columnDiv.appendChild(dndContainer);
        return columnDiv;
    };

    this.getDndContainer = function() {
        return dndContainer;
    };

    this.getColumnNode = function() {
        return columnDiv;
    };
};
