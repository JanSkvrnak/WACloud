import React, {useState} from 'react';
import {useTranslation} from "react-i18next";
import {Header} from "../components/Header";
import {Link, Redirect} from "react-router-dom";
import {UserMenu} from "../components/UserMenu";
import {FiltersDrawer} from "../components/FiltersDrawer";
import {QueryForm} from "../forms/QueryForm";
import stopWordsCzech from "../config/stopWords";
import {addNotification} from "../config/notifications";
import AnalyticQueriesForm from "../forms/AnalyticQueriesForm";
import {Box, Button, Divider, Grid} from "@material-ui/core";
import IQuery from "../interfaces/IQuery";
import {HarvestsForm} from "../forms/HarvestsForm";
import {BlackButton} from "../components/BlackButton";

enum Stage {
  QUERY,
  ANALYTICS,
  PROCESS
}

export const SearchScreen = () => {
  const { t } = useTranslation();

  const [stage, setStage] = useState<Stage>(Stage.QUERY);

  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [query, setQuery] = useState<string>("");
  const [stopWords, setStopWords] = useState<string[]>(stopWordsCzech.sort());
  const [entriesLimit, setEntriesLimit] = useState<number>(1000);
  const [seed, setSeed] = useState<number|null>(null);
  const [harvests, setHarvests] = useState<string[]>([]);

  const [queries, setQueries] = useState<IQuery[]>([{queries: [], query: "", context: false, searchText: "", searchType: "", limit: 10}]);


  const [redirect, setRedirect] = useState(false);
  if (redirect) {
    return <Redirect push to="/history" />;
  }

  const handleSearch = () => {
    addNotification(t('query.start.title'), t('query.start.message'), 'info');
    fetch("/api/search", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base: {
          filter: (query.length === 0 ? "*:*" : query),
          harvests: harvests,
          entries: entriesLimit,
          stopWords: stopWords.map(v => v.trim()),
          randomSeed: seed
        }, queries: queries.map(function(x) {
          return {
            type: x.searchType,
            texts: x.queries,
            contextSize: (x.context ? x.contextSize : 0),
            limit: x.limit
          };
        })}),
    }).then(() => setRedirect(true));
    return;
  };

  const stages = [
    {
      'state': Stage.QUERY,
      'content': (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <QueryForm value={query} setValue={setQuery}/>
          </Grid>
          <Grid item xs={12}>
            <HarvestsForm harvests={harvests} setHarvests={setHarvests} minimal={false}/>
          </Grid>
          <Grid item xs={12}>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Button variant="contained" size="large" color="primary" onClick={() => {
                  setStage(Stage.ANALYTICS);
                  setDrawerOpen(false);
                }}>
                  {t('query.continue')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )
    },
    {
      'state': Stage.ANALYTICS,
      'content': (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <QueryForm value={query} setValue={setQuery} disabled={true}/>
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <HarvestsForm harvests={harvests} setHarvests={setHarvests} minimal={true}/>
              </Grid>
              <Grid item>
                <BlackButton variant="contained" size="large" onClick={() => {
                  setStage(Stage.QUERY);
                  setDrawerOpen(true);
                }}>
                  {t('query.edit')}
                </BlackButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider/>
          </Grid>
          <Grid item xs={12}>
            <AnalyticQueriesForm queries={queries} setQueries={setQueries}/>
          </Grid>
          {queries.length > 0 && (
            <>
              <Divider/>
              <Box m={2}>
                <Button variant="contained" size="large" color="primary" onClick={handleSearch}>
                  {t('query.search')}
                </Button>
              </Box>
            </>
          )}
        </Grid>
      )
    }
  ]

  return (
    <Header toolbar={
      <>
        <Link to="/search" style={{color: '#0000ff'}}>{t('header.newQuery')}</Link>
        {/*<Link to="/favorite">{t('header.favorite')}</Link>*/}
        <Link to="/history">{t('header.myQueries')}</Link>
        <UserMenu />
      </>
    } drawer={
      <FiltersDrawer query={query} setQuery={setQuery}
                     stopWords={stopWords} setStopWords={setStopWords}
                     entriesLimit={entriesLimit} setEntriesLimit={setEntriesLimit}
                     seed={seed} setSeed={setSeed}
                     drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
                     disabled={stage !== Stage.QUERY} />
    }>
      {stages.filter(s => s.state === stage)[0].content}
    </Header>
  );
};

