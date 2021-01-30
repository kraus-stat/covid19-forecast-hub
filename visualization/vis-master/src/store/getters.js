import * as utils from './utils'

export const branding = state => state.branding
export const metadata = state => state.metadata
//export const history = state => state.history
export const seasonDataUrls = state => state.seasonDataUrls
export const scoresDataUrls = state => state.scoresDataUrls
export const distDataUrls = state => state.distDataUrls
export const updateTime = state => {
  return state.metadata ? state.metadata.updateTime : 'NA'
}

/**
 * Return seasons for which we have downloaded the data
 */
export const downloadedSeasons = state => {
  return state.seasonData.map(d => d.seasonId)
}

/**
 * Return seasons for which we have downloaded the data
 */
export const downloadedScores = state => {
  return state.scoresData.map(d => d.seasonId)
}

/**
 * Return selection ids for which we have downloaded distributions
 */
export const downloadedDists = state => {
  return state.distData.map(d => `${d.seasonId}-${d.regionId}`)
}

export const selectedSeasonId = (state, getters) => {
  return getters.seasons[getters['switches/selectedSeason']]
}

export const selectedRegionId = (state, getters) => {
  return getters.metadata.regionData[getters['switches/selectedRegion']].id
}

export const selectedScoresMeta = (state, getters) => {
  return getters['scores/scoresMeta'][getters['switches/selectedScore']]
}

/**
 * Return distributions data for the current selection
 */
export const selectedDistData = (state, getters) => {
  let selectedDistId = `${getters.selectedSeasonId}-${getters.selectedRegionId}`
  let distDataIdx = getters.downloadedDists.indexOf(selectedDistId)
  return state.distData[distDataIdx]
}

/**
 * Return subset of data reflecting current selection
 * Assume that we have already downloaded the data needed
 */
export const selectedData = (state, getters) => {
  let selectedRegionIdx = getters['switches/selectedRegion']
  let seasonSubset = state.seasonData[getters.downloadedSeasons.indexOf(getters.selectedSeasonId)]
  return seasonSubset.regions[selectedRegionIdx]
}

/**
 * Return scores data for current selection
 */
export const selectedScoresData = (state, getters) => {
  //let idx = getters.downloadedScores.indexOf(getters.selectedSeasonId)
  let idx = 0
  let subset = state.scoresData[idx].regions
    .find(({
      id
    }) => id === getters.selectedRegionId).models

  // Filter out the currently selected score now
  let scoreId = getters.selectedScoresMeta.id
  let modelIds = getters['models/modelIds']

  let scoresArray = modelIds.map(mid => {
    let modelScores = subset.find(({
      id
    }) => id === mid)
    return getters['scores/scoresTargets'].map(target => {
      return {
        best: false,
        value: modelScores.scores[target][scoreId]
      }
    })
  })

  // Find the best value
  let bestFunc = getters.selectedScoresMeta.bestFunc
  getters['scores/scoresTargets'].forEach((target, targetIdx) => {
    let targetValues = scoresArray.map(model => model[targetIdx].value)
    let bestIdx = targetValues.indexOf(bestFunc(targetValues))
    if (bestIdx > -1) {
      scoresArray[bestIdx][targetIdx].best = true
    }
  })

  return scoresArray
}

/**
 * Return list of seasons available for us
 */
export const seasons = (state, getters) => {
  if (state.metadata) {
    return state.metadata.seasonIds
  } else {
    return ['']
  }
}

export const regions = (state, getters) => {
  if (state.metadata) {
    return state.metadata.regionData.map(r => r.subId)
  } else {
    return ['']
  }
}

export const choropleths = state => ['Actual Weighted ILI (%)', 'Relative Weighted ILI (%)']

export const timeChart = state => state.timeChart
export const choropleth = state => state.choropleth
export const distributionChart = state => state.distributionChart

/**
 * Return observed data for currently selected state
 */
// export const observed = (state, getters) => {
//   return getters.selectedData.actual.map(d => d.lagData)
// }

/**
 * Return a series of time points to be referenced by all series
 */
export const timePoints = (state, getters) => {
  if (state.seasonData.length > 0) {
    return getters.selectedData.actual.map(d => {
      return {
        week: d.week % 100,
        year: Math.floor(d.week / 100)
      }
    })
  } else {
    return [{
      week: 0,
      year: 0
    }]
  }
}

/**
 * Return actual data for currently selected state
 */
export const actual = (state, getters) => {
  return getters.selectedData.actual.map(d => d.actual)
}

/**
 * Return historical data for selected state
 * All data older than currently selected season
 */
export const historicalData = (state, getters) => {
  let selectedRegionIdx = getters['switches/selectedRegion']
  let selectedRegionId = getters.selectedRegionId
  let selectedSeasonIdx = getters['switches/selectedSeason']
  let weeksCount = getters.selectedData.actual.length

  let output = []

  // Add data from history store
  // getters.history[selectedRegionId].forEach(h => {
  //   output.push({
  //     id: h.season,
  //     actual: utils.trimHistory(h.data, weeksCount)
  //   })
  // })

  // NOTE: Skipping season not yet downloaded
  for (let i = 0; i < selectedSeasonIdx; i++) {
    let downloadedSeasonIdx = getters.downloadedSeasons.indexOf(getters.seasons[i])
    if (downloadedSeasonIdx !== -1) {
      let seasonActual = state.seasonData[downloadedSeasonIdx].regions[selectedRegionIdx].actual
      output.push({
        id: getters.seasons[i],
        actual: utils.trimHistory(
          seasonActual.map(d => {
            return {
              week: d.week,
              data: d.actual
            }
          }),
          weeksCount
        )
      })
    }
  }

  return output
}

/**
 * Baseline for selected state
 */
// export const baseline = (state, getters) => {
//   return getters.selectedData.baseline
// }

/**
 * Return data subset for chart as specified in region/season selected
 */
export const timeChartData = (state, getters) => {
  return {
    timePoints: getters.timePoints,
    // observed:  getters.actual,
    actual: getters.actual,
    //baseline: getters.baseline,
    models: getters['models/models'],
    // history: getters.historicalData
  }
}


/**
 * Return data for distribution plot
 */
export const distributionChartData = (state, getters) => {
  return {
    timePoints: getters.timePoints,
    currentIdx: getters['weeks/selectedWeekIdx'],
    models: getters['models/modelDistributions']
  }
}

/**
 * Return actual data for all regions for current selections
 */
export const choroplethData = (state, getters) => {
  let selectedSeasonIdx = getters['switches/selectedSeason']
  let relative = getters['switches/choroplethRelative']
  let output = {
    data: [],
    type: relative ? 'diverging' : 'sequential',
    decorator: relative ? x => x + ' % (baseline)' : x => x + ' %'
  }
  let downloadedSeasonIdx = getters.downloadedSeasons.indexOf(getters.seasons[selectedSeasonIdx])

  state.seasonData[downloadedSeasonIdx].regions.map((reg, regIdx) => {
    let values = reg.actual.map(d => d.actual)
    //if (relative) values = utils.baselineScale(values, reg.baseline)
    output.data.push({
      region: getters.metadata.regionData[regIdx].subId,
      states: getters.metadata.regionData[regIdx].states,
      values: values
    })
  })

  // Get choropleth map range
  output.data = output.data.slice(1) // Remove national data
  let rangeData = output.data
  let dataRange = []
  let maxVals = []
  let minVals = []
  let popu = {'US': 328728466.0, 'AL': 4903185.0, 'AK': 731545.0, 'AZ': 7278717.0, 'AR': 3017804.0, 'CA': 39512223.0, 'CO': 5758736.0, 'CT': 3565287.0, 'DE': 973764.0, 'DC': 705749.0, 'FL': 21477737.0, 'GA': 10617423.0, 'HI': 1415872.0, 'ID': 1787065.0, 'IL': 12671821.0, 'IN': 6732219.0, 'IA': 3155070.0, 'KS': 2913314.0, 'KY': 4467673.0, 'LA': 4648794.0, 'ME': 1344212.0, 'MD': 6045680.0, 'MA': 6892503.0, 'MI': 9986857.0, 'MN': 5639632.0, 'MS': 2976149.0, 'MO': 6626371.0, 'MT': 1068778.0, 'NE': 1934408.0, 'NV': 3080156.0, 'NH': 1359711.0, 'NJ': 8882190.0, 'NM': 2096829.0, 'NY': 19453561.0, 'NC': 10488084.0, 'ND': 762062.0, 'OH': 11689100.0, 'OK': 3956971.0, 'OR': 4217737.0, 'PA': 12801989.0, 'RI': 1059361.0, 'SC': 5148714.0, 'SD': 884659.0, 'TN': 6829174.0, 'TX': 28995881.0, 'UT': 3205958.0, 'VT': 623989.0, 'VA': 8535519.0, 'WA': 7614893.0, 'WV': 1792147.0, 'WI': 5822434.0, 'WY': 578759.0, 'AS': 55641.0, 'GU': 164229.0, 'MP': 55144.0, 'PR': 3754939.0, 'VI': 107268.0}
  rangeData.map(regionData => {
    let actual = regionData.values.filter(d => d)
    
    //popu[regionData.states[0]]
    maxVals.push((Math.max(...actual)/popu[regionData.states[0]])*100000)
    minVals.push((Math.min(...actual)/popu[regionData.states[0]])*100000)
  
  
  })
  dataRange = [Math.min(...minVals), Math.max(...maxVals)]
  output.range = dataRange
  //output.range = utils.choroplethDataRange(state.seasonData, relative)
  return output

}