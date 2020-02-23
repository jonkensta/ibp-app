import React, { useState, useEffect } from 'react';

import { useParams } from "react-router-dom";

import { Grid, CircularProgress } from "@material-ui/core"
import { Card, CardHeader, CardContent } from "@material-ui/core"

import {
  InfoTable as InmateInfoTable,
  RequestTable as InmateRequestTable,
  CommentTable as InmateCommentTable,
} from '../components';

export default (props) => {

  const { jurisdiction, id } = useParams();
  const [ error, setError ] = useState(null);
  const [ results, setResults ] = useState(null);

  useEffect(() => {
    const getInmate = async (jurisdiction, id) => {
      const url = `${props.urlBase}/inmate/${jurisdiction}/${id}`;
      const response = await fetch(url);
      const json = await response.json();
      if (!response.ok) {
        setError(json);
      } else {
        setResults(json);
      }
    };
    getInmate(jurisdiction, id);
  }, [props.urlBase, jurisdiction, id]);

  if (error) {
    return <h3>No inmate matched given URL parameters.</h3>;
  }

  if (!results) {
    return <CircularProgress />;
  }

  const InfoCardContent = () => (
    <CardContent>
      <InmateInfoTable {...results.inmate} />
    </CardContent>
  );

  const fetchHelper = async (url, method, data=undefined) => {
    return await fetch(url, {
      method: method,
      credentials: "same-origin",
      body: data && JSON.stringify(data),
      headers: {'Content-Type': 'application/json'},
    });
  };

  const RequestsCardContent = () => {

    const handleRequestAdd = async (newRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}`;
      const response = await fetchHelper(url, 'POST', newRequest);
      const json = await response.json();
      return [json, response.ok];
    };

    const handleRequestUpdate = async (oldRequest, newRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      const response = await fetchHelper(url, 'PUT', newRequest);
      const json = await response.json();
      return [json, response.ok];
    };

    const handleRequestDelete = async (oldRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      const response = await fetchHelper(url, 'DELETE');
      return response.ok;
    };

    return (
      <InmateRequestTable
        Container={CardContent}
        jurisdiction={jurisdiction} id={id}
        data={results.inmate.requests}
        defaultDatePostmarked={results.datePostmarked}
        onRequestAdd={handleRequestAdd}
        onRequestUpdate={handleRequestUpdate}
        onRequestDelete={handleRequestDelete}
      />
    );
  };

  const CommentsCardContent = () => {

    const handleCommentAdd = async (newComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}`;
      const response = await fetchHelper(url, 'POST', newComment);
      const json = await response.json();
      return [json, response.ok];
    };

    const handleCommentUpdate = async (oldComment, newComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      const response = await fetchHelper(url, 'PUT', newComment);
      const json = await response.json();
      return [json, response.ok];
    };

    const handleCommentDelete = async (oldComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      const response = await fetchHelper(url, 'DELETE');
      return response.ok;
    };

    return (
      <InmateCommentTable
        Container={CardContent}
        jurisdiction={jurisdiction} id={id}
        data={results.inmate.comments}
        onCommentAdd={handleCommentAdd}
        onCommentUpdate={handleCommentUpdate}
        onCommentDelete={handleCommentDelete}
      />
    );
  };

  return (
    <>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Inmate Information" />
        <InfoCardContent />
      </Grid>
      <Grid item xs={8} lg={3} component={Card} variant="outlined">
        <CardHeader title="Requests"/>
        <RequestsCardContent />
      </Grid>
      <Grid item xs={8} lg={4} component={Card} variant="outlined">
        <CardHeader title="Comments"/>
        <CommentsCardContent />
      </Grid>
    </>
  );
};
