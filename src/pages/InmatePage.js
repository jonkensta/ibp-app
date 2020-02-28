import React, { useState, useEffect } from "react";

import { useParams } from "react-router-dom";

import { Grid, CircularProgress } from "@material-ui/core";
import { Card, CardHeader, CardContent } from "@material-ui/core";

import moment from "moment";

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
        json.inmate.requests.forEach((request) => {
          request.date_postmarked = moment(request.date_postmarked, "YYYY-MM-DD").toDate();
        });
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

    const getUserFeedback = async (messages) => {
      setDialogMessages(messages)
      setDialogOpen(true);
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
      const datePostmarked = moment(newRequest.date_postmarked).format("YYYY-MM-DD");
      let request = {...newRequest, date_postmarked: datePostmarked};

      if (newRequest.action === "Filled") {
        const endpoint = `${props.urlBase}/warning/${jurisdiction}/${id}`;
        const url = `${endpoint}?datePostmarked=${datePostmarked}`
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Bad response from server.");
        }

        const messages = await response.json();
        if (messages && messages.length > 0) {
          const feedback = await getUserFeedback(messages);
          if (feedback === "Toss") {
            request.action = "Tossed";
          }
        }
      }

      const url = `${props.urlBase}/request/${jurisdiction}/${id}`;
      const response = await fetchHelper(url, "POST", request);
      const json = await response.json();

      let [data, errors] = (response.ok) ? [json, []] : [null, json]

      if (data) {
        data.date_postmarked = moment(data.date_postmarked, "YYYY-MM-DD").toDate();
      }

      return [data, errors];
    };

    const handleRequestUpdate = async (oldRequest, newRequest) => {
      const datePostmarked = moment(newRequest.date_postmarked).format("YYYY-MM-DD");
      const request = {...newRequest, date_postmarked: datePostmarked};
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      const response = await fetchHelper(url, "PUT", request);
      const json = await response.json();

      let [data, errors] = (response.ok) ? [json, []] : [null, json]

      if (data) {
        data.date_postmarked = moment(data.date_postmarked, "YYYY-MM-DD").toDate();
      }

      return [data, errors];
    };

    const handleRequestDelete = async (oldRequest) => {
      const url = `${props.urlBase}/request/${jurisdiction}/${id}/${oldRequest.index}`;
      const response = await fetchHelper(url, "DELETE");
      return response.ok;
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

    const defaultDatePostmarked = moment(results.datePostmarked, "YYYY-MM-DD").toDate();

    return (
      <>
        <InmateRequestTable
          components={{Container: CardContent}}
          jurisdiction={jurisdiction} id={id}
          data={results.inmate.requests}
          defaultDatePostmarked={defaultDatePostmarked}
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
      const response = await fetchHelper(url, "POST", newComment);
      const json = await response.json();
      return (response.ok) ? [json, []] : [null, json]
    };

    const handleCommentUpdate = async (oldComment, newComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      const response = await fetchHelper(url, "PUT", newComment);
      const json = await response.json();
      return (response.ok) ? [json, []] : [null, json]
    };

    const handleCommentDelete = async (oldComment) => {
      const url = `${props.urlBase}/comment/${jurisdiction}/${id}/${oldComment.index}`;
      const response = await fetchHelper(url, "DELETE");
      return response.ok;
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
