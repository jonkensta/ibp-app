import React, { useState, useEffect } from "react";

import { useParams } from "react-router-dom";

import { Grid, CircularProgress } from "@material-ui/core"
import { Card, CardHeader, CardContent } from "@material-ui/core"

import {
  ConfirmationDialog,
  InfoTable as InmateInfoTable,
  RequestTable as InmateRequestTable,
  CommentTable as InmateCommentTable,
} from "../components";

export default (props) => {

  const { jurisdiction, id } = useParams();
  const [ error, setError ] = useState(null);
  const [ results, setResults ] = useState(null);

  useEffect(() => {
    const getInmate = async (jurisdiction, id) => {
      const url = `${props.urlBase}/inmate/${jurisdiction}/${id}`;
      const response = await fetch(url);
      const json = await response.json();
      if (response.ok) {
        setResults(json);
      } else {
        setError(json);
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
      headers: {"Content-Type": "application/json"},
    });
  };

  const RequestsCardContent = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessages, setDialogMessages] = useState([]);
    const [dialogHandler, setDialogHandler] = useState(null);

    const getUserFeedback = async () => {
      return await new Promise((resolve, reject) => {
        setDialogHandler(() => (
          (response) => {
            resolve(response);
            setDialogOpen(false);
          }
        ));
      });
    };

    const handleRequestAdd = async (newRequest) => {
      if (newRequest.action === "Filled") {
        const endpoint = `${props.urlBase}/warning/${jurisdiction}/${id}`;
        const url = `${endpoint}?datePostmarked=${newRequest.date_postmarked}`;
        const response = await fetch(url);
        const messages = await response.json();

        if (messages && messages.length > 0) {
          setDialogMessages(messages)
          setDialogOpen(true);
          const response = await getUserFeedback();
          if (response === "Toss") {
            newRequest.action = "Tossed";
          }
        }
      }

      const url = `${props.urlBase}/request/${jurisdiction}/${id}`;
      return await fetchHelper(url, "POST", newRequest);
    };

    const handleRequestUpdate = async (oldRequest, newRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      return await fetchHelper(url, "PUT", newRequest);
    };

    const handleRequestDelete = async (oldRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      return await fetchHelper(url, "DELETE");
    };

    const print_action = (data) => ({
      icon: "print",
      tooltip: "Print label",
      disabled: data.action !== "Filled",
      onClick: (event, rowData) => {
        event.preventDefault();
        alert(`Print label for ${jurisdiction} inmate ${id} ${data.index}.`);
      }
    });

    return (
      <>
        <InmateRequestTable
          components={{Container: CardContent}}
          jurisdiction={jurisdiction} id={id}
          data={results.inmate.requests}
          defaultDatePostmarked={results.datePostmarked}
          onRequestAdd={handleRequestAdd}
          onRequestUpdate={handleRequestUpdate}
          onRequestDelete={handleRequestDelete}
          actions={[print_action]}
        />
        <ConfirmationDialog
          open={dialogOpen}
          onClose={dialogHandler}
          messages={dialogMessages}
        />
      </>
    );
  };

  const CommentsCardContent = () => {

    const handleCommentAdd = async (newComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}`;
      return await fetchHelper(url, "POST", newComment);
    };

    const handleCommentUpdate = async (oldComment, newComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      return await fetchHelper(url, "PUT", newComment);
    };

    const handleCommentDelete = async (oldComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      return await fetchHelper(url, "DELETE");
    };

    return (
      <InmateCommentTable
        components={{Container: CardContent}}
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
