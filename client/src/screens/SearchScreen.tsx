import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Box, Button, Divider, Grid, CircularProgress, makeStyles } from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import StarIcon from '@material-ui/icons/Star';

import { Header } from '../components/Header';
import { UserMenu } from '../components/UserMenu';
import { FiltersDrawer } from '../components/FiltersDrawer';
import { QueryForm } from '../forms/QueryForm';
import stopWordsCzech from '../config/stopWords';
import { addNotification } from '../config/notifications';
import AnalyticQueriesForm from '../forms/AnalyticQueriesForm';
import IQuery from '../interfaces/IQuery';
import { HarvestsForm } from '../forms/HarvestsForm';
import { BlackButton } from '../components/BlackButton';
import ProcessStatus from '../components/ProcessStatus';
import { SearchState } from '../interfaces/ISearch';

enum Stage {
  QUERY,
  ANALYTICS,
  PROCESS
}

const useStyles = makeStyles(() => ({
  icon: {
    marginRight: '1rem'
  }
}));

export const SearchScreen = () => {
  const { t } = useTranslation();
  const classes = useStyles();

  const [stage, setStage] = useState<Stage>(Stage.QUERY);

  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [query, setQuery] = useState<string>('');
  const [stopWords, setStopWords] = useState<string[]>(stopWordsCzech.sort());
  const [entriesLimit, setEntriesLimit] = useState<number>(1000);
  const [seed, setSeed] = useState<number | null>(null);
  const [harvests, setHarvests] = useState<string[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('WAITING');
  const [queryId, setQueryId] = useState<number>();

  const [queries, setQueries] = useState<IQuery[]>([
    {
      queries: [],
      queriesOpposite: [],
      query: '',
      context: false,
      searchText: '',
      searchTextOpposite: '',
      searchType: '',
      limit: 10,
      useOnlyDomains: false,
      useOnlyDomainsOpposite: false
    }
  ]);

  const refreshSearchState = (id: number) => {
    fetch(`/api/search/${id}`)
      .then((res) => res.json())
      .then((data) => setSearchState(data.state));
  };

  const handleSearch = () => {
    addNotification(t('query.start.title'), t('query.start.message'), 'info');
    fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base: {
          filter: query.length === 0 ? '*:*' : query,
          harvests: harvests,
          entries: entriesLimit,
          stopWords: stopWords.map((v) => v.trim()),
          randomSeed: seed
        },
        queries: queries.map(function (x) {
          return {
            type: x.searchType,
            texts: x.queries,
            textsOpposite: x.queriesOpposite,
            contextSize: x.context ? x.contextSize : 0,
            limit: x.limit,
            useOnlyDomains: x.useOnlyDomains,
            useOnlyDomainsOpposite: x.useOnlyDomainsOpposite
          };
        })
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setStage(Stage.PROCESS);
        setQueryId(data.id);
      });
    return;
  };

  const handleDownload = () => {
    ['DONE'].includes(searchState) &&
      fetch(`/api/download/${queryId}`).then((response) =>
        response
          .blob()
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'results.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            addNotification(t('query.success.title'), t('query.success.message'), 'success');
          })
          .catch(() => addNotification(t('query.error.title'), t('query.error.message'), 'danger'))
      );
  };

  useEffect(() => {
    if (stage === Stage.PROCESS && queryId) {
      refreshSearchState(queryId);
      const interval = setInterval(() => {
        refreshSearchState(queryId);
        if (searchState === 'DONE') {
          clearInterval(interval);
        }
      }, 1500);
      if (searchState === 'DONE') {
        clearInterval(interval);
      }
      return () => {
        clearInterval(interval);
      };
    }
  }, [stage, searchState, queryId]);

  const stages = [
    {
      state: Stage.QUERY,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <QueryForm value={query} setValue={setQuery} />
          </Grid>
          <Grid item xs={12}>
            <HarvestsForm harvests={harvests} setHarvests={setHarvests} minimal={false} />
          </Grid>
          <Grid item xs={12}>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  onClick={() => {
                    setStage(Stage.ANALYTICS);
                    setDrawerOpen(false);
                  }}>
                  {t<string>('query.continue')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )
    },
    {
      state: Stage.ANALYTICS,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <QueryForm value={query} setValue={setQuery} disabled={true} />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <HarvestsForm harvests={harvests} setHarvests={setHarvests} minimal={true} />
              </Grid>
              <Grid item>
                <BlackButton
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setStage(Stage.QUERY);
                    setDrawerOpen(true);
                  }}>
                  {t<string>('query.edit')}
                </BlackButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <AnalyticQueriesForm queries={queries} setQueries={setQueries} />
          </Grid>
          {queries.length > 0 && (
            <>
              <Divider />
              <Box m={2}>
                <Button variant="contained" size="large" color="primary" onClick={handleSearch}>
                  {t<string>('query.search')}
                </Button>
              </Box>
            </>
          )}
          {stage === Stage.PROCESS && <ProcessStatus state={searchState} />}
        </Grid>
      )
    },
    {
      state: Stage.PROCESS,
      content: (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <QueryForm value={query} setValue={setQuery} disabled={true} />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <HarvestsForm harvests={harvests} setHarvests={setHarvests} minimal={true} />
              </Grid>
              <Grid item>
                <BlackButton
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setStage(Stage.QUERY);
                    setDrawerOpen(true);
                  }}>
                  {t<string>('query.edit')}
                </BlackButton>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <AnalyticQueriesForm queries={queries} setQueries={setQueries} />
          </Grid>
          <ProcessStatus state={searchState} />
          {queries.length > 0 && (
            <>
              <Divider />
              <Box m={2}>
                {(searchState === 'WAITING' ||
                  searchState === 'INDEXING' ||
                  searchState === 'PROCESSING') && (
                  <BlackButton variant="contained" size="large">
                    {t<string>('process.stop')}
                  </BlackButton>
                )}
              </Box>
            </>
          )}
          {searchState === 'DONE' && (
            <Grid item xs={12}>
              <Grid container justifyContent="flex-start" spacing={2}>
                <Grid item>
                  <Button
                    key="download"
                    variant="contained"
                    color={'primary'}
                    disabled={!['DONE', 'ERROR'].includes(searchState)}
                    size="medium"
                    onClick={handleDownload}>
                    <>
                      {!['DONE', 'ERROR'].includes(searchState) ? (
                        <CircularProgress size={15} />
                      ) : (
                        <GetAppIcon className={classes.icon} />
                      )}
                      {t<string>('query.buttons.download')}
                    </>
                  </Button>
                </Grid>
                <Grid item>
                  <Button key="favourite" variant="text" color={'default'} size="medium">
                    <>
                      <StarIcon className={classes.icon} color="primary" />
                      <span style={{ color: '#0000ff' }}>
                        {t<string>('query.buttons.addToFavorites')}
                      </span>
                    </>
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      )
    }
  ];

  return (
    <Header
      toolbar={
        <>
          <Link to="/search" style={{ color: '#0000ff' }}>
            {t<string>('header.newQuery')}
          </Link>
          <Link to="/favorite">{t<string>('header.favorite')}</Link>
          <Link to="/history">{t<string>('header.myQueries')}</Link>
          <UserMenu />
        </>
      }
      drawer={
        <FiltersDrawer
          query={query}
          setQuery={setQuery}
          stopWords={stopWords}
          setStopWords={setStopWords}
          entriesLimit={entriesLimit}
          setEntriesLimit={setEntriesLimit}
          seed={seed}
          setSeed={setSeed}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          disabled={stage !== Stage.QUERY}
        />
      }>
      {stages.filter((s) => s.state === stage)[0].content}
    </Header>
  );
};

export default SearchScreen;
