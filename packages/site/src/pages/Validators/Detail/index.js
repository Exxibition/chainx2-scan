import React, { useEffect, useMemo, useState } from 'react'
import Breadcrumb from '../../../components/Breadcrumb'
import $t from '../../../locale'
import AccountLink from '../../../components/AccountLink'
import PanelList from '../../../components/PanelList'
import classnames from 'classnames'
import TrustSet from './TrustSet'
import Nominators from './Nominators'
import Missed from './Missed'
import { useParams } from 'react-router-dom'
import { decodeAddress } from '../../../shared'
import { useLoad, useLoadDetail } from '../../../utils/hooks'
import api from '../../../services/api'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchValidatorNodes,
  validatorNodesSelector
} from '../../../store/reducers/validatorsSlice'
import NoData from '../../../components/NoData'
import Spinner from '../../../components/Spinner'
import Amount from '../../../components/Amount'

export default function() {
  const { address } = useParams()
  const hash = decodeAddress(address)
  const { items: blocks, total } = useLoad(api.fetchBlocks, hash)
  console.log(hash)
  const { number } = useLoad(api.fetchBlockCount,hash)
    console.log(number)

  let name = ''
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].author === hash) {
      name = blocks[i].referralId
    }
  }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchValidatorNodes(setLoading, page - 1, pageSize))
  }, [dispatch, page, pageSize])

  const { newitems = [] } = useSelector(validatorNodesSelector) || {}

    let lastTotalVoteWeight = ''
  let weekMissed = 0
  let selfBonded = 0
  let totalNomination = 0
  let rewardPotBalance = 0
    let rewardPotAccount = ''
    let lastTotalVoteWeightUpdate = 0
  for (let i = 0; i < newitems.length; i++) {
    if (newitems[i].account === address) {
      selfBonded = newitems[i].selfBonded
      totalNomination = newitems[i].totalNomination
      rewardPotBalance = newitems[i].rewardPotBalance
        rewardPotAccount = newitems[i].rewardPotAccount
        weekMissed = newitems[i].weekMissed
        lastTotalVoteWeight = newitems[i].lastTotalVoteWeight
        lastTotalVoteWeightUpdate = newitems[i].lastTotalVoteWeightUpdate
    }
  }

  const [activeKey, setActiveKey] = useState('missed')
  const breadcrumb = (
    <Breadcrumb
      dataSource={[
        { to: '/validators', label: $t('validators') },
        { label: $t('node_detail') }
      ]}
    />
  )
  if (loading) {
    return (
      <div>
        {breadcrumb}
        <div style={{ padding: '10%' }}>
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div>
      {breadcrumb}
      <PanelList
        dataSource={[
          {
            label: $t('referral_id'),
            data: name
          },
          {
            label: $t('address_item'),
            data: <AccountLink className="text-truncate" value={address} />
          },
          // {
          //   label: $t('block_authoring_address'),
          //   data: 0
          // },
          {
            label: $t('jackpot_address'),
            data: <AccountLink className="text-truncate" value={rewardPotAccount} />
          },
          {
            label: $t('self_bonded'),
            data: (
              <Amount
                value={selfBonded}
                precision={8}
                symbol={'PCX'}
                hideSymbol
              />
            )
          },
          {
            label: $t('total_nominations'),
            data: <Amount value={totalNomination} precision={8} hideSymbol />
          },
          {
            label: $t('reward_pot_balance'),
            data: (
              <Amount
                value={rewardPotBalance}
                precision={8}
                symbol={'PCX'}
                hideSymbol
              />
            )
          },
          {
            label: $t('week_missed'),
            data: weekMissed + '出块总数'
          },
          {
            label: $t('authored_blocks'),
            data: 0
          },
          {
            label: $t('vote_weight_last'),
            data: lastTotalVoteWeightUpdate
          },
          {
            label: $t('WEIGHT'),
            data: lastTotalVoteWeight
          }
        ]}
      />
      {/*<div className="box">*/}
      {/*    <div className="tabs">*/}
      {/*        <ul>*/}
      {/*            /!*<li*!/*/}
      {/*            /!*    onClick={() => setActiveKey('trustSet')}*!/*/}
      {/*            /!*    className={classnames({ 'is-active': activeKey === 'trustSet' })}*!/*/}
      {/*            /!*>*!/*/}
      {/*            /!*    <a>{$t('setup_trustee')}</a>*!/*/}
      {/*            /!*</li>*!/*/}

      {/*            /!*<li*!/*/}
      {/*            /!*    onClick={() => setActiveKey('nominators')}*!/*/}
      {/*            /!*    className={classnames({ 'is-active': activeKey === 'nominators' })}*!/*/}
      {/*            /!*>*!/*/}
      {/*            /!*    <a>{$t('nominators')}</a>*!/*/}
      {/*            /!*</li>*!/*/}

      {/*            /!*<li*!/*/}
      {/*            /!*    onClick={() => setActiveKey('missed')}*!/*/}
      {/*            /!*    className={classnames({*!/*/}
      {/*            /!*        'is-active': activeKey === 'missed'*!/*/}
      {/*            /!*    })}*!/*/}
      {/*            /!*>*!/*/}
      {/*            /!*    <a>{$t('missed')}</a>*!/*/}
      {/*            /!*</li>*!/*/}
      {/*        </ul>*/}
      {/*    </div>*/}
      {/*    {activeKey === 'trustSet' &&  <TrustSet/>}*/}
      {/*    {activeKey === 'nominators' && <Nominators/>}*/}
      {/*    {activeKey === 'missed' && <Missed/>}*/}
      {/*</div>*/}
    </div>
  )
}
