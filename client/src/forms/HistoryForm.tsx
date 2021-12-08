import React, {useEffect, useState} from 'react';
import {
  Button, Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@material-ui/core';
import PublishIcon from '@material-ui/icons/Publish';
import {useTranslation} from "react-i18next";
import {addNotification} from "../config/notifications";
import ISearch from "../interfaces/ISearch";

export const HistoryForm = () => {
  const { t, i18n } = useTranslation();

  const [queries, setQueries] = useState<ISearch[]>([]);

  const stateToString = (state: string) => {
    switch (state) {
      case "WAITING": return t('administration.harvests.states.UNPROCESSED');
      case "INDEXING": return t('process.indexing');
      case "PROCESSING": return t('administration.harvests.states.PROCESSING');
      case "ERROR": return t('administration.harvests.states.ERROR');
      case "DONE": return t('process.finished');
    }
    return '?';
  }

  const refreshSearches = () => {
    fetch("/api/search")
      .then(res => res.json())
      .then(
        (result) => {
          setQueries(result);
        },
        (_error) => {
          setQueries([]);
        }
      );
  };

  useEffect(() => {
    refreshSearches();

    const interval = setInterval(refreshSearches, 2500);
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Typography variant="h1">
        {t('header.myQueries')}
      </Typography>
      <Card variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('query.header')}</TableCell>
                <TableCell>{t('query.created')}</TableCell>
                <TableCell>{t('query.state')}</TableCell>
                <TableCell/>
              </TableRow>
            </TableHead>
            <TableBody>
              {queries.map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell><span aria-label={row.filter}>{
                    row.filter.length > 60 ?
                      row.filter.substring(0, 60 - 3) + "..." :
                      row.filter
                  }</span></TableCell>
                  <TableCell>{(new Date(row.createdAt)).toLocaleString(i18n.language)}</TableCell>
                  <TableCell>
                    {stateToString(row.state)}
                  </TableCell>
                  <TableCell>
                    {['DONE'].includes(row.state) && (
                      <Button color="primary"
                              onClick={() => {
                                fetch("/api/download/"+row.id)
                                  .then(response => response.blob())
                                  .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    let a = document.createElement('a');
                                    a.href = url;
                                    a.download = "results.zip";
                                    document.body.appendChild(a); // we need to append the element to the dom -> otherwise it will not work in firefox
                                    a.click();
                                    a.remove();  //afterwards we remove the element again
                                    addNotification(t('query.success.title'), t('query.success.message'), 'success');
                                  })
                                  .catch(_error => addNotification(t('query.error.title'), t('query.error.message'), 'danger'));
                              }}
                              startIcon={<PublishIcon/>}
                      >
                        {t('query.buttons.download')}
                      </Button>
                    )}
                    {!['DONE','ERROR'].includes(row.state) && <CircularProgress size={15} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  );
}
