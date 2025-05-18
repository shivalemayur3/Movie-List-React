import { useEffect, useState } from "react";
import { debounce } from "lodash";

// Note : The App.js can be splits into components but i purposefully kept all the component in same file for quick reivew.

function NavBar({ children }) {
  return (<nav className="nav-bar">
    <div className="logo">
    <h1>Movies App</h1>
  </div>
    {children}
  </nav>)
}

function NumResults({ movies }) {
  return (<p className="num-results" >
    Found < strong >{movies.length}</strong > results
  </p >)
}

function Search({ query, setQuery }) {
  return (<input
    className="search"
    type="text"
    placeholder="Type to Search movies..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />)
}

function Movie({ movie, onSelectMovie }) {
  return (<li onClick={() => onSelectMovie(movie.imdbID)}
    key={movie.imdbID}>
    <img src={movie.Poster} alt={`${movie.Title} poster`} />
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>🗓</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>)
}

function MoviesList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID}
          onSelectMovie={onSelectMovie}></Movie>
      ))}
    </ul>
  )
}

function Box({ children, movieList, query }) {
  return (
    <div className="box">
      {movieList && query.length === 0 && <div className="emptybox">
        <h1 className="emptytext">Search for a film or TV show!</h1>
      </div>}
      {children}
    </div>)
}

function SelectedMovieSummary() {
  return (<div className="summary">
    <h2>Movies Details Section</h2>
    <div>
      <p>
        No Movie Selected
      </p>
    </div>
  </div>)
}

function Main({ children }) {
  return (
    <main className="main">
      {children}
    </main>
  )
}

function Loader() {
  return <>
    <p className="loader">Loading...</p>
  </>
}

function ErrorMessage({ message }) {
  return <p className="error">
    <span>😒 </span>{message}
  </p>
}

const KEY = 'b9a5e69d'

function MovieDetails({ selectedId, onCloseMovie, addedMovie }) {
  const [movie, setMovie] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { Title: title, Poster: poster, Runtime: runtime, imdbRating, Plot: plot, Released: released,
    Actors: actors, Director: director, Genre: genre, Ratings } = movie;

  useEffect(function () {
    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`);
      const data = await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    const debounceGetMovieDetails = debounce(getMovieDetails, 500);
    debounceGetMovieDetails();
    return () => {
      debounceGetMovieDetails.cancel();
    };
  }, [selectedId]);


  return (<div className="details">
    {isLoading ? <Loader></Loader> : <><header>
      <button className="btn-back" onClick={onCloseMovie}>
        &larr;
      </button>
      <img src={poster} alt={`Poster of ${movie}`}></img>
      <div className="details-overview">
        <h2>{title}</h2>
        <p>{released} &bull; {runtime}</p>
        <p>{genre}</p>
        <p><span>🌟</span>{imdbRating} IMDb Rating</p>
      </div>
    </header>
      <section>
        <p>{Ratings?.map((rating) => <p className="ratings"><span>{rating.Source} :  </span><span>{rating.Value}</span></p>)}</p>
        <p><em>{plot}</em></p>
        <p>Starring: {actors}</p>
        <p>Directed by: {director}</p>
      </section></>}
  </div>)
}

export default function App() {
  const [query, setQuery] = useState("movie");
  const [sortDir, setSortDir] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  function handleSelectMovie(id) {
    if (id === selectedId) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
    }
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function sortMovies(moviesData, direction) {
      return [...moviesData].sort((a, b) => {
        return direction === "Year" ? b.Year - a.Year : a.Year - b.Year;
      })
  }

  function changeSortDirection(direction) {
    setSortDir(direction);
    console.log(sortMovies(movies));
    setMovies(sortMovies(movies,direction));

  }

  useEffect(function () {
    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(`https://www.omdbapi.com/?apikey=${KEY}&s=${query}`);

        if (!res.ok) throw new Error("Something went wrong");

        const data = await res.json()
        if (data.Response === 'False') throw new Error(`No movies found with name ${query}`)
        setMovies(data.Search);
        console.log(data.Search);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (query.length < 3) {
      setMovies([])
      setError("");
      return;
    }
    fetchMovies();
  }, [query]);

  return (
    <>
      <NavBar>
        <select className="sort" onChange={(e) => changeSortDirection(e.target.value)}>
          <option value="">Sort By</option>
          <option value="Year">By Year</option>
        </select>
        <Search query={query} setQuery={setQuery}></Search>
        <NumResults movies={movies}></NumResults>
      </NavBar>
      <Main>
        <Box movieList={true} query={query}>
          {isLoading && <Loader></Loader>}
          {!isLoading && !error && <MoviesList movies={movies} sortDir={sortDir}
            onSelectMovie={handleSelectMovie} setMovies={setMovies}></MoviesList>}
          {error && <ErrorMessage message={error}></ErrorMessage>}
        </Box>
        <Box>
          {selectedId ? <MovieDetails
            selectedId={selectedId} onCloseMovie={handleCloseMovie} /> :
            <>
              <SelectedMovieSummary />
            </>
          }
        </Box>
      </Main>
    </>
  );
}
