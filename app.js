//get loader elements when loading
const loader = document.querySelector(".loader");
const loaderContainer = document.querySelector(".loader-container");

// start loading
loading("start");

// run code when app load
window.addEventListener("load", () => {
  loading("finish");

  const form = document.querySelector("form");
  const input = document.querySelector("input");
  const randomBtn = document.querySelector(".btn-random");
  const resultsAllBox = document.querySelector(".result-all");
  const modal = document.querySelector("#modal-container");

  // Show default meals on loading
  if (localStorage.getItem("meal")) {
    input.value = localStorage.getItem("meal");
    searchMeal();
  } else {
    input.value = "potato";
    searchMeal();
  }

  // === Event Listeners ===
  form.addEventListener("submit", searchMeal);

  resultsAllBox.addEventListener("click", (e) => {
    if (e.target.parentNode.getAttribute("data-id")) {
      const mealId = e.target.parentNode.getAttribute("data-id");
      getMealById(mealId);
    } else if (e.target.classList.contains("meal-title")) {
      const mealId = e.target.parentNode.parentNode.getAttribute("data-id");
      getMealById(mealId);
    }
  });

  randomBtn.addEventListener("click", () => {
    loading("start");
    getMealRandom();
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("meal-category")) {
      loading("start");
      const category = e.target.textContent.trim();
      closeModal();
      getMealByType(category, "category");
    }
    if (e.target.classList.contains("meal-area")) {
      loading("start");
      const area = e.target.textContent.trim();
      closeModal();
      getMealByType(area, "area");
    }
  });

  // === Functions ===

  // search meal by input
  function searchMeal(e = null) {
    if (e) {
      e.preventDefault();
    }

    const query = input.value.trim();
    localStorage.setItem("meal", query);

    if (query) {
      loading("start");
      clearInput(input);
      updateDOM(query, "byQuery");
    }
  }

  // clear input after search
  function clearInput(input) {
    input.value = "";
  }

  // get meal by input query
  async function getMealByQuery(query) {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
    );
    const data = await res.json();
    return data;
  }

  // get meal by click on area or category
  async function getMealByType(query, type) {
    let res;
    if (type === "category") {
      res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${query}`
      );
    } else if (type === "area") {
      res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?a=${query}`
      );
    }
    const data = await res.json();
    updateDOM(data, "byType", (filter = query));
  }

  // get meal by click on certain meal
  async function getMealById(id) {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    );
    const data = await res.json();
    updateDOM(data, "byId");
  }

  // get meal by click on random button
  async function getMealRandom() {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/random.php`
    );
    const data = await res.json();
    updateDOM(data, "byId");
  }

  // close modal for single meal
  function closeModal() {
    modal.classList.add("out");
    document.querySelector("body").classList.remove("modal-active");
    setTimeout(() => {
      modal.removeAttribute("class");
    }, 1000);
  }

  // update DOM after get response from api
  function updateDOM(query, type, filter = "") {
    // update DOM after searching
    if (type === "byQuery") {
      getMealByQuery(query).then((meals) => {
        if (meals.meals) {
          resultsAllBox.innerHTML = `<h2>Search result for "${query}":</h2><div class="meals"></div>`;
          meals.meals.forEach((meal) => {
            resultsAllBox.querySelector(".meals").innerHTML += `
              <div class="meal" data-id="${meal.idMeal}">
                  <div class="meal-image">
                    <div class="meal-image-spinner"></div>
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
                  </div>
                <div class="meal-overlay" >
                  <h3 class="meal-title">${meal.strMeal}</h3>
                  <div class='meal-info'>
                    <div class="meal-category">${meal.strCategory}</div>
                    <div class="meal-area">${meal.strArea}</div>
                  </div> 
                </div>
              </div>
            `;
          });
        } else {
          resultsAllBox.innerHTML = `<h2>No search results found! Please try again.</h2>`;
        }
        loading("finish");
      });
    }

    // update DOM after get certain meal info
    if (type === "byId") {
      const meal = query.meals[0];

      // get only available ingredients from all
      let allIngredients = [];
      for (let i = 0; i <= 20; i++) {
        let currentIngredient = meal[`strIngredient${i}`];
        if (currentIngredient) {
          allIngredients.push(currentIngredient);
        }
      }

      modal.querySelector(".modal").innerHTML = `
      <i class='bx bx-x bx-lg'></i>
      <h2>${meal.strMeal}</h2>
      <div class='meal-info'>
        <div class="meal-image">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
        </div>
        <div class='meal-inner-info'>
          <div class='meal-categories'>
            <div class='meal-category'> ${meal.strCategory}</div>
            <div class='meal-area'>${meal.strArea}</div>
          </div>
          <div class='meal-ingredients'>
            <h3>Ingredients:</h3>
            <p>${allIngredients.join(", ")}</p>
          </div>
          <div class='meal-instructions'>
            <h3>Instructions:</h3>
            <p>${meal.strInstructions.replace(/(\r\n|\r|\n)/g, "<br>")}</p>
          </div>
        </div>
      </div>
    `;

      // show modal
      document.querySelector("body").classList.add("modal-active");
      modal.classList.add("active");

      //close modal triggers
      modal.querySelector(".bx-x").addEventListener("click", closeModal);
      document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
          closeModal();
        }
      });

      modal
        .querySelector(".modal-background")
        .addEventListener("click", (e) => {
          if (e.target === e.currentTarget) closeModal();
        });

      loading("finish");
    }

    // update DOM after get area or category meals
    if (type === "byType") {
      const meals = query.meals;
      if (meals) {
        resultsAllBox.innerHTML = `<h2>All Meal by ${filter}:</h2><div class="meals"></div>`;
        meals.forEach((meal) => {
          resultsAllBox.querySelector(".meals").innerHTML += `
        <div class="meal" data-id="${meal.idMeal}">
          <div class="meal-image">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}"/>
          </div>
          <div class="meal-overlay" >
            <h3 class="meal-title">${meal.strMeal}</h3>
          </div>
        </div>
      `;
        });
      }
      loading("finish");
    }
  }
});

//Preloader
function loading(action) {
  if (action === "start") {
    loaderContainer.style.display = "block";
    loader.classList.remove("loader-finish");
    loader.classList.add("loader-start");
  }
  if (action === "finish") {
    loaderContainer.style.display = "none";
    loader.classList.remove("loader-start");
    loader.classList.add("loader-finish");
  }
}
