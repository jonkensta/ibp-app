import React, { useState, useEffect } from 'react';

import {
  Route, Switch, Redirect,
  useParams, useLocation,
  BrowserRouter as Router,
} from "react-router-dom";

import {
  Grid, Container,
  TextField,
  CircularProgress,
  Snackbar, SnackbarContent,
  Card, CardHeader, CardContent,
  Table, TableBody, TableRow, TableCell, TableHead,
} from '@material-ui/core';

import { makeStyles } from '@material-ui/core/styles';

import {
  Unit as InmateUnit,
  FullName as InmateFullName,
  InfoTable as InmateInfoTable,
  FormattedID as InmateFormattedID,
  Jurisdiction as InmateJurisdiction,
  RequestTable as InmateRequestTable,
  CommentTable as InmateCommentTable,
} from './inmate';

const URL_BASE = "http://localhost:3000";

function PageNotFoundPage() {
  let location_ = useLocation();
  return <h3>No match for <code>{location_.pathname}</code></h3>;
}

function SearchForm(props) {
  const [ query, setQuery ] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    document.location = `/search?query=${query}`;
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        required
        label="inmate name or ID number"
        id="outlined-search" type="search" variant="outlined"
        error={Boolean(props.error)}
        helperText={props.error}
        onChange={handleChange}
      />
    </form>
  );
}

const useStyles = makeStyles(theme => ({
  tableRow: {
    cursor: 'pointer',
  }
}));

function SearchResultsPage(props) {
  const classes = useStyles();

  const [ results, setResults ] = useState(null);
  const [ error, setError ] = useState(null);

  const location_ = useLocation();
  const searchParams = new URLSearchParams(location_.search);
  const query = searchParams.get("query");

  useEffect(() => {
    async function searchInmates() {
      const endpoint = `${URL_BASE}/inmate`;
      const url = new URL(endpoint);
      url.searchParams.append("query", query);
      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        setError(json);
      } else {
        setResults(json);
      }
    }
    searchInmates();
  }, [query]);

  if (error) {
    props.setInputError(error);
    return <Redirect to={{pathname: "/" }}/>;
  }

  if (!results) {
    return <CircularProgress />;
  }

  if (!(results.inmates && results.inmates.length > 0)) {
    props.setInputError("No inmates matched your search.");
    return <Redirect to={{pathname: "/" }} />
  }

  props.setResultsErrors(results.errors);

  if (results.inmates.length && results.inmates.length === 1) {
    const inmate = results.inmates[0];
    return <Redirect to={{pathname: `inmate/${inmate.jurisdiction}/${inmate.id}`}} />;
  }

  const fields = ["Name", "Jurisdiction", "ID", "Unit"];
  const ResultsTableHead = () => (
    <TableHead>
      <TableRow>
        {fields.map((field, index) => (
        <TableCell component="th" scope="row" key={index}>
          {field + ':'}
        </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  const ResultsTableRow = (props) => {
    const components = [
      <InmateFullName first={props.first_name} last={props.last_name} />,
      <InmateJurisdiction jurisdiction={props.jurisdiction} />,
      <InmateFormattedID id={props.id} />,
      <InmateUnit {...props.unit} />,
    ];

    return (
      <TableRow
        hover className={classes.tableRow}
        onClick={() => {
          document.location = `inmate/${props.jurisdiction}/${props.id}`;
        }}
      >
        {components.map((component, index) => (
        <TableCell key={index}>
          {component}
        </TableCell>
        ))}
      </TableRow>
    );
  };

  const ResultsTableBody = (props) => (
    <TableBody>
      {props.inmates.map((inmate, index) => (
      <ResultsTableRow key={index} {...inmate} />
      ))}
    </TableBody>
  );

  return (
    <Grid item xs={8} lg={5} component={Card} variant="outlined">
      <Table>
        <ResultsTableHead />
        <ResultsTableBody inmates={results.inmates} />
      </Table>
    </Grid>
  );
}

function InmatePage(props) {
  const { jurisdiction, id } = useParams();
  const [ error, setError ] = useState(null);
  const [ results, setResults ] = useState(null);

  useEffect(() => {
    async function getInmate(jurisdiction, id) {
      const endpoint = `${URL_BASE}/inmate/${jurisdiction}/${id}`;
      const response = await fetch(endpoint, {credentials: "same-origin"});
      const json = await response.json();
      if (!response.ok) {
        setError(json);
      } else {
        setResults(json);
      }
    }
    getInmate(jurisdiction, id)
  }, [jurisdiction, id]);

  if (error) {
    return <h3>No inmate matched given URL parameters.</h3>;
  }

  if (!results) {
    return <CircularProgress />;
  }

  return (
    <>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Inmate Information" />
        <CardContent>
          <InmateInfoTable {...results.inmate} />
        </CardContent>
      </Grid>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Requests"/>
        <InmateRequestTable
          urlBase={URL_BASE}
          Container={CardContent}
          jurisdiction={jurisdiction} id={id}
          requests={results.inmate.requests}
          defaultDatePostmarked={results.datePostmarked}
        />
      </Grid>
      <Grid item xs={8} lg={4} component={Card} variant="outlined">
        <CardHeader title="Comments"/>
        <InmateCommentTable
          urlBase={URL_BASE}
          Container={CardContent}
          jurisdiction={jurisdiction} id={id}
          comments={results.inmate.comments}
        />
      </Grid>
    </>
  );
};

export default () => {
  const [ searchError, setSearchError ] = useState(null);
  const [ snackbarErrors, setSnackbarErrors ] = useState([]);

  const searchResultsPage = (
    <SearchResultsPage
      setInputError={setSearchError}
      setResultsErrors={setSnackbarErrors}
    />
  );

  return (
    <Container maxWidth="xl">
      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: '10vh' }}
      >
        <Grid container direction="row" justify="space-evenly" alignitems="stretch">
          <Grid item xs={8} lg={5}>
            <SearchForm error={searchError} />
          </Grid>
        </Grid>
      </Grid>

      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: '5vh' }}
      >
      </Grid>

      <Grid
        container
        direction="column"
        alignitems="center"
        justify="center"
        style={{ minHeight: '80vh' }}
        spacing={8}
      >
        <Grid container direction="row" justify="space-evenly" alignitems="stretch">
          <Router>
            <Switch>
              <Route exact path="/" />
              <Route exact path="/search" children={searchResultsPage} />
              <Route exact path="/inmate/:jurisdiction/:id" children={<InmatePage />} />
              <Route path="*" children={<PageNotFoundPage />} />
            </Switch>
          </Router>
        </Grid>
      </Grid>

      {snackbarErrors.length > 0 && snackbarErrors.map((error, index) => (
        <Snackbar open={true} message={error} key={index} />
      ))}

    </Container>
  );
}
