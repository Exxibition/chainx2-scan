import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPairs } from '@src/store/reducers/dexSlice'
import PairList from '@src/pages/Dex/PairList'
import $t from '@src/locale'
import classnames from 'classnames'
import CurrentEntrust from '@src/pages/Dex/CurrentEntrust'

const { useState } = require('react')

export default function() {
  const [activeKey, setActiveKey] = useState('currentEntrust')

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchPairs())
  }, [])

  return (
    <>
      <div className="columns">
        <div className="column">
          <PairList />
        </div>
      </div>

      <div className="box">
        <div className="tabs">
          <ul>
            <li
              onClick={() => setActiveKey('currentEntrust')}
              className={classnames({
                'is-active': activeKey === 'currentEntrust'
              })}
            >
              <a>{$t('dex_open_orders')}</a>
            </li>
            <li
              onClick={() => setActiveKey('historyEntrust')}
              className={classnames({
                'is-active': activeKey === 'historyEntrust'
              })}
            >
              <a>{$t('dex_fill_history')}</a>
            </li>
          </ul>
        </div>
        {activeKey === 'currentEntrust' && <CurrentEntrust />}
      </div>
    </>
  )
}
