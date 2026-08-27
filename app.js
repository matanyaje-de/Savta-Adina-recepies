/* ספר המתכונים של סבתא — לוגיקת האפליקציה.
   אתר סטטי לגמרי: אין שרת, אין ספריות חיצוניות, אין קריאות רשת.
   כל הנתונים נטענים מ-data.js וכל התמונות מתיקיית images/ שלצד הקבצים. */

(function () {
  "use strict";

  var ICONS = {
    clock:
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    arrowRight:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
    heart:
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none" aria-hidden="true">' +
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l8.84 8.84 8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
    messageSquare:
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    send:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>'
  };

  var FALLBACK_IMAGE =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
        '<rect width="800" height="600" fill="#EBE3D5"/>' +
        '<rect x="24" y="24" width="752" height="552" fill="none" stroke="#D4C3A3" stroke-width="2" stroke-dasharray="10 8"/>' +
        '<circle cx="400" cy="290" r="70" fill="none" stroke="#B59A7F" stroke-width="6"/>' +
        '<path d="M365 300h70M400 265v70" stroke="#B59A7F" stroke-width="6" stroke-linecap="round"/>' +
      "</svg>"
    );

  var bookView = document.getElementById("book-view");
  var recipeView = document.getElementById("recipe-view");
  var categoriesEl = document.getElementById("categories");
  var searchInput = document.getElementById("search-input");
  var gridEl = document.getElementById("recipe-grid");
  var emptyStateEl = document.getElementById("empty-state");

  var activeCategory = CATEGORIES[0];
  var searchQuery = "";
  var selectedRecipe = null;
  var comments = {};
  var gridScrollY = 0;

  /* ------------------------------------------------------------ עזרים */

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function attachImageFallback(root) {
    var images = root.querySelectorAll("img[data-fallback]");
    for (var i = 0; i < images.length; i++) {
      images[i].addEventListener("error", function () {
        if (this.src !== FALLBACK_IMAGE) {
          this.src = FALLBACK_IMAGE;
        }
      });
    }
  }

  /* מכיל טקסט חופשי: משמש גם לחיפוש וגם למניעת רגישות לרווחים מיותרים */
  function contains(haystack, needle) {
    return haystack.indexOf(needle) !== -1;
  }

  function filteredRecipes() {
    return RECIPES.filter(function (recipe) {
      var matchesCategory =
        activeCategory === CATEGORIES[0] || recipe.category === activeCategory;
      var matchesSearch =
        searchQuery === "" ||
        contains(recipe.title, searchQuery) ||
        recipe.ingredients.some(function (ingredient) {
          return contains(ingredient, searchQuery);
        });
      return matchesCategory && matchesSearch;
    });
  }

  /* --------------------------------------------------------- ניווט וסינון */

  function renderCategories() {
    categoriesEl.innerHTML = CATEGORIES.map(function (category) {
      return (
        '<button type="button" class="category-btn" data-category="' +
        escapeHtml(category) +
        '" aria-pressed="' +
        (category === activeCategory) +
        '">' +
        escapeHtml(category) +
        "</button>"
      );
    }).join("");
  }

  function renderGrid() {
    var recipes = filteredRecipes();

    gridEl.innerHTML = recipes
      .map(function (recipe) {
        return (
          '<button type="button" class="recipe-card" data-id="' +
          recipe.id +
          '">' +
          '<span class="card-media">' +
          '<img src="' +
          escapeHtml(recipe.image) +
          '" alt="' +
          escapeHtml(recipe.title) +
          '" loading="lazy" width="800" height="600" data-fallback>' +
          '<span class="card-badge">' +
          escapeHtml(recipe.category) +
          "</span>" +
          "</span>" +
          '<span class="card-body">' +
          "<h3>" +
          escapeHtml(recipe.title) +
          "</h3>" +
          '<span class="card-story">' +
          escapeHtml(recipe.story) +
          "</span>" +
          '<span class="card-time">' +
          ICONS.clock +
          "<span>" +
          escapeHtml(recipe.prepTime) +
          "</span></span>" +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    attachImageFallback(gridEl);
    emptyStateEl.hidden = recipes.length > 0;
  }

  /* ------------------------------------------------------ תצוגת מתכון */

  /* בכמה מתכונים השורה הראשונה של icing היא כותרת ("לקרם:") ולא מצרך */
  function extrasTitle(icing) {
    if (icing.length > 0 && contains(icing[0], ":")) {
      return icing[0];
    }
    return "תוספות / מילוי";
  }

  function extrasItems(icing) {
    if (icing.length > 0 && contains(icing[0], ":")) {
      return icing.slice(1);
    }
    return icing;
  }

  function listMarkup(items) {
    return (
      '<ul class="item-list">' +
      items
        .map(function (item) {
          return "<li><span>" + escapeHtml(item) + "</span></li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function extrasMarkup(recipe) {
    if (!recipe.icing || recipe.icing.length === 0) {
      return "";
    }
    return (
      '<div class="extras">' +
      "<h4>" +
      escapeHtml(extrasTitle(recipe.icing)) +
      "</h4>" +
      listMarkup(extrasItems(recipe.icing)) +
      "</div>"
    );
  }

  function stepsMarkup(instructions) {
    return (
      '<div class="steps">' +
      instructions
        .map(function (step, index) {
          return (
            '<div class="step"><div class="step-num">' +
            (index + 1) +
            ".</div><p>" +
            escapeHtml(step) +
            "</p></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function renderRecipe(recipe) {
    recipeView.innerHTML =
      '<div class="recipe-detail">' +
      '<div class="detail-nav">' +
      '<button type="button" class="back-btn" id="back-btn">' +
      ICONS.arrowRight +
      '<span>חזרה לספר</span>' +
      "</button>" +
      "</div>" +
      '<article class="recipe-page"><div class="recipe-page-inner">' +
      '<div class="detail-head">' +
      '<span class="detail-category">' +
      escapeHtml(recipe.category) +
      "</span>" +
      "<h2>" +
      escapeHtml(recipe.title) +
      "</h2>" +
      '<p class="detail-story">&ldquo;' +
      escapeHtml(recipe.story) +
      '&rdquo;</p>' +
      "</div>" +
      '<figure class="detail-photo">' +
      '<img src="' +
      escapeHtml(recipe.image) +
      '" alt="' +
      escapeHtml(recipe.title) +
      '" width="800" height="600" data-fallback>' +
      '<span class="tape"></span>' +
      "</figure>" +
      '<div class="detail-columns">' +
      '<div class="ingredients-box">' +
      '<h3 class="section-title">מצרכים</h3>' +
      listMarkup(recipe.ingredients) +
      extrasMarkup(recipe) +
      "</div>" +
      "<div>" +
      '<h3 class="section-title">אופן ההכנה</h3>' +
      stepsMarkup(recipe.instructions) +
      "</div>" +
      "</div>" +
      '<div class="dedication">' +
      '<span class="heart">' +
      ICONS.heart +
      "</span>" +
      "<span>לזכרה, באהבה</span>" +
      "</div>" +
      commentsMarkup(recipe) +
      "</div></article>" +
      '<button type="button" class="floating-back-btn" id="floating-back-btn" aria-label="חזרה לספר המתכונים">' +
      ICONS.arrowRight +
      '<span>חזרה לספר</span>' +
      "</button>" +
      "</div>";

    attachImageFallback(recipeView);
    document.getElementById("back-btn").addEventListener("click", closeRecipe);
    document.getElementById("floating-back-btn").addEventListener("click", closeRecipe);
    bindCommentForm(recipe);
  }

  /* ------------------------------------------------------------ תגובות */

  function commentsMarkup(recipe) {
    return (
      '<section class="comments">' +
      '<div class="comments-head">' +
      ICONS.messageSquare +
      "<h3>זיכרונות ותגובות</h3>" +
      "</div>" +
      '<form class="comment-form" id="comment-form">' +
      '<label class="visually-hidden" for="comment-name">השם שלך</label>' +
      '<input type="text" id="comment-name" placeholder="השם שלך" required>' +
      '<label class="visually-hidden" for="comment-text">התגובה שלך</label>' +
      '<textarea id="comment-text" rows="3" placeholder="כתבי כאן זיכרון מהמתכון, או איך יצא לך כשהכנת בעצמך..." required></textarea>' +
      '<button type="submit">' +
      ICONS.send +
      "<span>הוסיפי תגובה</span>" +
      "</button>" +
      '<p class="comment-note">התגובות נשמרות רק בחלון הזה — אין שרת מאחורי הספר, ורענון הדף ינקה אותן.</p>' +
      "</form>" +
      '<div class="comment-list" id="comment-list">' +
      commentListMarkup(recipe.id) +
      "</div>" +
      "</section>"
    );
  }

  function commentListMarkup(recipeId) {
    var list = comments[recipeId] || [];
    if (list.length === 0) {
      return '<p class="comments-empty">עדיין אין תגובות. תהיי הראשונה לשתף זיכרון!</p>';
    }
    return list
      .map(function (comment) {
        return (
          '<div class="comment">' +
          '<div class="comment-meta">' +
          '<span class="comment-name">' +
          escapeHtml(comment.name) +
          "</span>" +
          '<span class="comment-date">' +
          escapeHtml(comment.date) +
          "</span>" +
          "</div>" +
          "<p>" +
          escapeHtml(comment.text) +
          "</p>" +
          "</div>"
        );
      })
      .join("");
  }

  function bindCommentForm(recipe) {
    var form = document.getElementById("comment-form");
    var nameInput = document.getElementById("comment-name");
    var textInput = document.getElementById("comment-text");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = nameInput.value.trim();
      var text = textInput.value.trim();
      if (name === "" || text === "") {
        return;
      }

      if (!comments[recipe.id]) {
        comments[recipe.id] = [];
      }
      comments[recipe.id].push({
        name: name,
        text: text,
        date: new Date().toLocaleDateString("he-IL")
      });

      document.getElementById("comment-list").innerHTML = commentListMarkup(recipe.id);
      form.reset();
      nameInput.focus();
    });
  }

  /* ------------------------------------------------------- מיתוג תצוגות */

  function showBook() {
    selectedRecipe = null;
    recipeView.hidden = true;
    recipeView.innerHTML = "";
    bookView.hidden = false;
    window.scrollTo(0, gridScrollY);
  }

  function showRecipe(recipe, addHistoryEntry) {
    gridScrollY = window.scrollY;
    selectedRecipe = recipe;
    bookView.hidden = true;
    recipeView.hidden = false;
    renderRecipe(recipe);
    window.scrollTo(0, 0);

    if (addHistoryEntry !== false) {
      window.history.pushState(
        { view: "recipe", recipeId: recipe.id },
        "",
        "#recipe-" + recipe.id
      );
    }
  }

  function closeRecipe() {
    if (window.history.state && window.history.state.view === "recipe") {
      window.history.back();
      return;
    }

    showBook();
    window.history.replaceState(
      { view: "book" },
      "",
      window.location.pathname + window.location.search
    );
  }

  /* ------------------------------------------------------------ אירועים */

  categoriesEl.addEventListener("click", function (event) {
    var button = event.target.closest(".category-btn");
    if (!button) {
      return;
    }
    activeCategory = button.dataset.category;
    renderCategories();
    renderGrid();
  });

  searchInput.addEventListener("input", function () {
    searchQuery = searchInput.value.trim();
    renderGrid();
  });

  gridEl.addEventListener("click", function (event) {
    var card = event.target.closest(".recipe-card");
    if (!card) {
      return;
    }
    var recipe = RECIPES.find(function (item) {
      return String(item.id) === card.dataset.id;
    });
    if (recipe) {
      showRecipe(recipe, true);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && selectedRecipe) {
      closeRecipe();
    }
  });

  window.addEventListener("popstate", function (event) {
    var state = event.state || {};
    if (state.view === "recipe") {
      var recipe = RECIPES.find(function (item) {
        return item.id === state.recipeId;
      });
      if (recipe) {
        showRecipe(recipe, false);
        return;
      }
    }
    showBook();
  });

  /* דפדפנים משחזרים את תוכן תיבת החיפוש לאחר רענון — מסנכרנים את המצב אליו */
  searchQuery = searchInput.value.trim();

  renderCategories();
  renderGrid();

  var recipeMatch = window.location.hash.match(/^#recipe-(\d+)$/);
  var initialRecipe = recipeMatch
    ? RECIPES.find(function (item) {
        return item.id === Number(recipeMatch[1]);
      })
    : null;

  if (initialRecipe) {
    window.history.replaceState(
      { view: "recipe", recipeId: initialRecipe.id },
      "",
      window.location.href
    );
    showRecipe(initialRecipe, false);
  } else {
    window.history.replaceState(
      { view: "book" },
      "",
      window.location.pathname + window.location.search
    );
  }
})();
