// variables for url
const IMAGE_BASE_URI = 'http://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w300'; //or w300
const baseUrl = 'https://tvdbtest.herokuapp.com/api/search/movie?query=';
let searchQuery = '';
let activePageNumber;

// includes the movies, page number, and total number of pages
let queryResult;

// store the movies data (results array from query)
let movies;

// for highlighting the search words
let searchString = '';

// how many pages display in pagination
const maxDisplayNumberOfPages = 5;

// to prevent deactivating not existing page numbers
let isNewPagination;

// arrows for pagination
const leftArrow = `<a href="#" id="leftArrow" onclick="previousPage();return false;">&laquo;</a>`;
const rightArrow = `<a href="#" id="rightArrow" onclick="nextPage();return false;">&raquo;</a>`;

// elements from html
const moviesList = document.getElementById('moviesList');
const searchBar = document.getElementById('searchBar');
const pagination = document.getElementById('pagination');
const releaseYear = document.getElementById('releaseYear');

// event listeners

// search the movie
searchBar.addEventListener('keyup', (event) => {
  searchString = event.target.value;

  // replace the space with ? to fit for the url query
  searchQuery = searchString.toLowerCase().replace(/\s/g, '?');

  isNewPagination = true;
  jumpToPage(1);
});

// filter search results by year
releaseYear.addEventListener('change', (event) => {
  displayMoviesByYear(event.target.value);
});

// functions

// get the relevant movies according to search results or page number
const loadMovies = async () => {
  try {
    const res = await fetch(
      `${baseUrl}${searchQuery}&page=${activePageNumber}`
    );
    queryResult = await res.json();
    // sort movies by year (ascending)
    movies = queryResult.results.sort((a, b) => {
      return new Date(a.release_date) - new Date(b.release_date);
    });
    displayMoviesByYear('All'); // new search result
    loadYears(); // for the years filtering
  } catch (err) {
    console.error(err);
  }
};

// display their poster, title and release date
const displayMoviesByYear = (year) => {
  const yearToSearch = year == 'All' ? '' : year;
  const htmlString = movies
    // display only the movies with selected year
    .filter((movie) => {
      if (movie.release_date != undefined && movie.release_date != null)
        return movie.release_date.includes(yearToSearch);
    })
    // insert movie info within the html
    .map((movie) => {
      let movieTitle = movie.title;
      // convert the search string into RegEx pattern
      let re = new RegExp(searchString, 'gi');
      // add the <mark> tag to the search word
      // the use of match() is to avoid changing the original title
      movieTitle.replace();
      let highlightedTitle = movieTitle.replace(
        re,
        `<mark>${movieTitle.match(re)}</mark>`
      );
      return `
            <li class="movie">
              <div class="front">
                <h2>${highlightedTitle}</h2>
                <h4>${movie.release_date}</h4>
                <img src="${IMAGE_BASE_URI}${POSTER_SIZE}${movie.poster_path}" alt="${movieTitle} poster"/>
              </div>
              <div class="back"><b>${movieTitle}</b><p>${movie.overview}</p></div>
            </li>
        `;
    })
    .join('');
  moviesList.innerHTML = htmlString;
};

// load the years into the drop down list
const loadYears = () => {
  let htmlString = '';
  // save the years in array to avoid duplicates
  let years = [];
  years.push('<option>All</option>');
  for (let movieData of movies) {
    const movieYear = new Date(movieData.release_date).getFullYear();
    // avoid adding undefined movie years and duplicates
    if (!isNaN(movieYear) && !years.includes(`<option>${movieYear}</option>`)) {
      years.push(`<option>${movieYear}</option>`);
    }
  }
  htmlString = years.join('');
  releaseYear.innerHTML = htmlString;
};

// called also when you click on the page number itself
const jumpToPage = async (pageNumber) => {
  // switch to smaller numbers of pagination when user pressed <<
  if (
    // it'll work (even fine) without this condition
    // just a small optimization step to avoid unnecessary pagination reloading
    // when you're on the first page and want to jump straight to last page in the current pagination
    activePageNumber != 1 &&
    // these two conditions are necessary to jump from higher pagination to lower one
    pageNumber % maxDisplayNumberOfPages == 0 &&
    activePageNumber % maxDisplayNumberOfPages == 1
  ) {
    loadPagination(pageNumber - maxDisplayNumberOfPages + 1);
  }

  // to prevent deactivating pages that were'nt activated in the first place
  // for example in new search result
  if (!isNewPagination) {
    deactivatePage();
  }

  // update the movies to show at the current page
  activePageNumber = pageNumber;
  await loadMovies();

  // switch to bigger numbers of pagination when user pressed >>
  if (pageNumber % maxDisplayNumberOfPages == 1) {
    loadPagination(pageNumber);
  }

  const totalNumberOfPages = queryResult.total_pages;

  // scope that deals with the arrows
  if (totalNumberOfPages > 1) {
    // to prevent adding the << arrow multiple times
    if (pageNumber > 1 && pagination.childNodes[0].id != 'leftArrow') {
      addLeftArrow();
    }

    // to prevent adding the >> arrow multiple times
    if (
      pageNumber < totalNumberOfPages &&
      pagination.childNodes[pagination.childElementCount - 1].id != 'rightArrow'
    ) {
      addRightArrow();
    }

    // to prevent removing non existing arrow
    if (pageNumber == 1 && pagination.childNodes[0].id == 'leftArrow') {
      removeLeftArrow();
    }

    // the same check doesn't done here because the
    // right arrow loaded anyway in first place
    // the last page is not what the user see for the first search result
    else if (pageNumber == totalNumberOfPages) {
      removeRightArrow();
    }
  }

  activatePage();

  isNewPagination = false;
};

// pagination functions

// loads the pagination from firstPageNumber to firstPageNumber + (maxDisplayNumberOfPages - 1)
const loadPagination = (firstPageNumber) => {
  const totalNumberOfPages = queryResult.total_pages;
  let htmlString = '';

  // last page number to display in pagination
  const lastPage = Math.min(
    totalNumberOfPages,
    firstPageNumber + maxDisplayNumberOfPages - 1
  );

  for (let i = firstPageNumber; i <= lastPage; i++) {
    htmlString += `<a href="#" id="page${i}" onclick="jumpToPage(${i});return false;">${i}</a>`;
  }

  pagination.innerHTML = htmlString;

  isNewPagination = true;
};

// remove the background and give the option to jump back to this page
const deactivatePage = () => {
  let currentActivePage = document.getElementById(`page${activePageNumber}`);
  currentActivePage.classList.remove('active');
  currentActivePage.setAttribute(
    'onclick',
    `jumpToPage(${activePageNumber});return false`
  );
};

// add the background and remove the option to jump to this page
const activatePage = () => {
  let currentActivePage = document.getElementById(`page${activePageNumber}`);
  currentActivePage.classList.add('active');
  currentActivePage.removeAttribute('onclick');
};

// when you click on >>
const nextPage = () => {
  jumpToPage(activePageNumber + 1);
};

// when you click on <<
const previousPage = () => {
  jumpToPage(activePageNumber - 1);
};

// append the left arrow to pagination
// if the user is moved from the first page
const addLeftArrow = () => {
  pagination.innerHTML = leftArrow + pagination.innerHTML;
};

// remove the left arrow from pagination
// if the user went back to the first page
const removeLeftArrow = () => {
  pagination.removeChild(pagination.childNodes[0]);
};

// append the right arrow to pagination
// if the user didn't get to the last page
const addRightArrow = () => {
  pagination.innerHTML += rightArrow;
};

// remove the right arrow from pagination
// if the user reached the last page
const removeRightArrow = () => {
  pagination.removeChild(
    pagination.childNodes[pagination.childElementCount - 1]
  );
};
