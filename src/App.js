import React, { useState, useEffect } from "react";

import { Grid, Container, CircularProgress } from "@material-ui/core"

import { Redirect, useLocation } from "react-router-dom";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";

import { InmatePage } from "./pages";
import {
  SimpleSnackbar,
  SearchResultsTable,
  SearchForm as InmateSearchForm
} from "./components";

const NoMatch = () => {
  const location_ = useLocation();
  return <h3>No match for <code>{location_.pathname}</code></h3>;
}

export default (props) => {

  const [inmates, setInmates] = useState(null);
  const [formError, setFormError] = useState(null);
  const [providerErrors, setProviderErrors] = useState([]);

  const fetchInmates = async (query) => {
    const url = new URL(`${props.urlBase}/inmate`);
    url.searchParams.append("query", query);
    const response = await fetch(url);
    const json = await response.json();
    if (response.ok) {
      setInmates(json.inmates);
      setProviderErrors(json.errors);
    } else {
      setFormError(json);
    }
  };

  const SearchForm = (props) => {
    const handleSubmit = (query) => {
      fetchInmates();
      document.location = `/search?query=${query}`;
    };
    return <InmateSearchForm onSubmit={handleSubmit} error={formError} />;
  };

  const SearchResults = (props) => {
    const location_ = useLocation();
    const searchParams = new URLSearchParams(location_.search);
    const query = searchParams.get("query");

    useEffect(() => {
      if (!(inmates && inmates.length > 0)) {
        fetchInmates(query);
      }
    }, [query]);

    if (!(formError || inmates)) {
      return <CircularProgress />;
    }

    if (formError) {
      return <Redirect to={{pathname: "/"}} />;
    }

    if (!inmates) {
      setFormError("No inmates matched your search.");
      return <Redirect to={{pathname: "/"}} />;
    }

    if (inmates.length === 1) {
      const inmate = inmates[0];
      return <Redirect to={{pathname: `/inmate/${inmate.jurisdiction}/${inmate.id}`}} />;
    }

    const handleClick = (jurisdiction, id) => {
      document.location = `/inmate/${jurisdiction}/${id}`;
    };

    return (
      <Grid item xs={10} lg={6}>
        <SearchResultsTable inmates={inmates} onClick={handleClick} />
        {providerErrors.map((error) => (<SimpleSnackbar message={error} />))}
      </Grid>
    );
  };

  const renderSearchResults = (rest) => (
    <SearchResults inmates={inmates} {...rest} />
  );

  const renderInmatePage = (rest) => (
    <InmatePage urlBase={props.urlBase} {...rest} />
  );

  return (
    <Container maxWidth="xl">
      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: "10vh" }}
      >
        <Grid container direction="row" justify="space-evenly" alignitems="stretch">
          <Grid item xs={8} lg={5}>
            <SearchForm />
          </Grid>
        </Grid>
      </Grid>

      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: "5vh" }}
      >
      </Grid>

      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: "80vh" }}
        spacing={8}
      >
        <Grid container direction="row" justify="space-evenly" alignitems="stretch">
          <Router>
            <Switch>
              <Route exact path="/" />
              <Route exact path="/search" render={renderSearchResults} />} />
              <Route exact path="/inmate/:jurisdiction/:id" render={renderInmatePage} />
              <Route path="*" children={<NoMatch />} />
            </Switch>
          </Router>
        </Grid>
      </Grid>

    </Container>
  );
}
