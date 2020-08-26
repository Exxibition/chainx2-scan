import React from 'react'
import { Route, Switch } from 'react-router'

import BlockChainNav from '../../components/BlockChainNav'
import List from './List'
import Detail from './Detail'

export default function Extrinsics() {
    return (
        <Switch>
            <Route path="/accounts/:address" component={Detail} />
            <Route
                path="/accounts"
                render={props => (
                    <div className="box">
                        <BlockChainNav activeKey="accounts" />
                        <List {...props} />
                    </div>
                )}
            />
        </Switch>
    )
}
