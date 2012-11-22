var SimpleCardRenderer = function(column, item) {
    rally.sdk.ui.cardboard.BasicCardRenderer.call(this, column, item);
    var that = this;
    this.renderCard = function() {
        var card = document.createElement("div");
        dojo.addClass(card, "simpleCard");
        dojo.addClass(card, rally.sdk.util.Ref.getTypeFromRef(item._ref));

        var textDiv = document.createElement("div");
        dojo.addClass(textDiv, "cardContent");

        card.appendChild(textDiv);

        var link = new rally.sdk.ui.basic.Link({item: item, text: item.Name});
        dojo.empty(textDiv);
        link.display(textDiv);

        return card;
    };
};
