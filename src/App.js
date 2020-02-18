import React, { useState, useEffect } from 'react';

import {
  Route, Switch, Redirect,
  useParams, useLocation,
  BrowserRouter as Router,
} from "react-router-dom";

import {
  Grid,
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

const URL_BASE = "http://localhost:8000";

function PageNotFoundPage() {
  let location_ = useLocation();
  return <h3>No match for <code>{location_.pathname}</code></h3>;
}

function SearchFormPage(props) {
  const [ query, setQuery ] = useState(null);
  const error = props.location && props.location.state && props.location.state.error;

  const handleSubmit = (event) => {
    if (error) {
      const state = {...props.location.state};
      delete state.error;

      const location = {...props.location, state}
      props.history.replace({location});
    }
    event.preventDefault();
    document.location = `/search?query=${query}`;
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  return (
    <Grid item xs={8} lg={4} variant="outlined">
      <form autoComplete="off" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          required
          label="inmate name or ID number"
          id="outlined-search" type="search" variant="outlined"
          error={Boolean(error)}
          helperText={error}
          onChange={handleChange}
        />
      </form>
    </Grid>
  );
}

function SearchResultsPage(props) {
  const useStyles = makeStyles({
    tableRow: {
      cursor: 'pointer',
    },
  });
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
    return <Redirect to={{pathname: "/", state: { error: error }}}/>;
  }

  if (!results) {
    return <CircularProgress />;
  }

  if (!(results.inmates && results.inmates.length)) {
    const error = "No inmates matched your search."
    return <Redirect to={{pathname: "/", state: { error: error }}}/>;
  }

  const ResultsErrors = (props) => {
    if (!props.errors || props.errors.length === 0 || !props.errors.length) {
      return <></>;
    }
    return (
      <Snackbar open={true}>
        {props.errors.map((error, index) => <SnackbarContent message={error} />)}
      </Snackbar>
    );
  };

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
        hover key={props.key} className={classes.tableRow}
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
      <ResultsErrors errors={results.errors} />
      <Table>
        <ResultsTableHead />
        <ResultsTableBody inmates={results.inmates} />
      </Table>
    </Grid>
  );
}

function InmatePage(props) {
  const { jurisdiction, id } = useParams();
  const [ inmate, setInmate ] = useState(null);
  const [ error, setError ] = useState(null);

  useEffect(() => {
    async function getInmate(jurisdiction, id) {
      const endpoint = `${URL_BASE}/inmate/${jurisdiction}/${id}`;
      const response = await fetch(endpoint);
      const json = await response.json();
      if (!response.ok) {
        setError(json);
      } else {
        setInmate(json);
      }
    }
    getInmate(jurisdiction, id)
  }, [jurisdiction, id]);

  if (error) {
    return <h3>No inmate matched given URL parameters.</h3>;
  }

  if (!inmate) {
    return <CircularProgress />;
  }

  return (
    <>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Inmate Information"/>
        <CardContent>
          <InmateInfoTable {...inmate}/>
        </CardContent>
      </Grid>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Requests"/>
        <InmateRequestTable
          url_base={URL_BASE}
          Container={CardContent}
          jurisdiction={jurisdiction} id={id}
          requests={inmate.requests}
        />
      </Grid>
      <Grid item xs={8} lg={4} component={Card} variant="outlined">
        <CardHeader title="Comments"/>
        <InmateCommentTable
          url_base={URL_BASE}
          Container={CardContent}
          jurisdiction={jurisdiction} id={id}
          comments={inmate.comments}
        />
      </Grid>
    </>
  );
};

export default () => {
  return (
    <Grid
      container
      direction="column"
      alignitems="center"
      justify="center"
      style={{ minHeight: '90vh' }}
      spacing={8}
    >
      <Grid
        container
        direction="row"
        justify="space-evenly"
        alignitems="stretch"
      >
        <Router>
          <Switch>
            <Route exact path="/" component={SearchFormPage} />
            <Route exact path="/search" component={SearchResultsPage} />
            <Route exact path="/inmate/:jurisdiction/:id" component={InmatePage} />
            <Route path="*" component={PageNotFoundPage} />
          </Switch>
        </Router>
      </Grid>
    </Grid>
  );
}
