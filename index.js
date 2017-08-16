/**
 * 手势解锁组件
 * @author Leo Wang(leowang721@gmail.com)
 */
import React, {Component} from 'react'
import {
    Animated,
    AsyncStorage,
    View,
    Text,
    Dimensions
} from 'react-native';

var kCore = require('k-core');
var {
    LifeStage,
    errorHandler
} = kCore;

var screenWidth = Dimensions.get('window').width;

var styles = require('./styles');
var GridView = require('./GridView');

var STORAGE_KEY = '@k-react-native-swipe-unlock:saved-password';

class SwipeUnlocker extends Component {

    constructor(props) {
        super(props);

        this.lifeStage = new LifeStage({
            stages: [
                'DEFAULT',
                'SET', 'SET_AGAIN', 'SET_FAILED', 'SET_SUCCESSFUL',
                'LOCKED', 'UNLOCK_ERROR', 'UNLOCKED'
            ]
        });

        this.initBehavior();

        this.state = {
            moved: new Animated.Value(0)
        };
    }

    initBehavior() {
        var me = this;
        me.lifeStage.on('transfer', me.processStageTransferred.bind(me));
        me.lifeStage.on('set_successful', (e) => {
            AsyncStorage.setItem(STORAGE_KEY, me.password)
                .then(() => {
                    me.lifeStage.switchTo('UNLOCKED');
                })
                .catch((error) => errorHandler(error.message))
                .done();
        });
        me.lifeStage.on('unlocked', () => {
            me.onUnlocked();
        });
    }

    onUnlocked() {
        var me = this;
        Animated.timing(  // 支持: spring, decay, timing，过渡的动画方式
            me.state.moved,
            {
                toValue: screenWidth,  // 目标值
                duration: 150
            }
        ).start(() => {
            me.props.onUnlocked && me.props.onUnlocked();
        });  // 开始
    }

    processStageTransferred(e) {
        this.setState({
            stage: e.to
        });
    }

    componentWillMount() {
        var me = this;
        if (me.props.stage !== 'DEFAULT') {
            me.lifeStage.switchTo(me.props.stage);
        }
        else {
            AsyncStorage.getItem(STORAGE_KEY)
                .then((value) => {
                    if (value !== null) {
                        // 获取到了，说明 set 过了
                        me.password = value;
                        me.lifeStage.switchTo('LOCKED');
                    }
                    else {
                        me.lifeStage.switchTo('SET');
                    }
                })
                .catch((error) => errorHandler(error.message))
                .done();
        }
    }

    onEachFinished(values) {
        if (values.length === 0) {
            return;
        }
        var currentStage = this.lifeStage.current();
        switch (currentStage) {
        case 'SET':
            this.firstValue = values.join('-');
            this.lifeStage.next();
        case 'SET_FAILED':
            this.firstValue = values.join('-');
            this.lifeStage.switchTo('SET_AGAIN');
            break;
        case 'SET_AGAIN':
            var secondValue = values.join('-');
            if (secondValue === this.firstValue) {
                this.password = secondValue;
                this.lifeStage.switchTo('SET_SUCCESSFUL');
            }
            else {
                this.lifeStage.switchTo('SET_FAILED');
            }
            break;
        case 'LOCKED':
        case 'UNLOCK_ERROR':
            if (values.join('-') === this.password) {
                this.lifeStage.switchTo('UNLOCKED');
            }
            else {
                this.lifeStage.switchTo('UNLOCK_ERROR');
            }
        default:
            break;
        }
    }

    getMessage() {
        var message = this.props.message || {};
        switch(this.lifeStage.current()) {
        case 'DEFAULT':
            return '请稍候';
        case 'SET':
            return message.set || '摸一次密码';
        case 'SET_AGAIN':
            return message.setAgain || '再摸一次密码';
        case 'SET_SUCCESSFUL':
            return message.setSuccessful || '设置成功';
        case 'SET_FAILED':
            return message.setError || '两次摸密码不一致，请重新设置';
        case 'LOCKED':
            return message.locked || '先摸摸看解锁';
        case 'UNLOCK_ERROR':
            return message.unlockError || '解锁失败';
        case 'UNLOCKED':
            return message.unlocked || '解锁成功';
        default:
            return '亲，是不是用错了？不认识这个状态。'
        }
    }

    getTitleStyle() {
        switch(this.lifeStage.current()) {
        case 'SET_SUCCESSFUL':
        case 'UNLOCKED':
            return styles.okTitle;
        case 'SET_FAILED':
        case 'UNLOCK_ERROR':
            return styles.errorTitle;
        default:
            return styles.normalTitle;
        }
    }

    render() {
        return (
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [
                            {translateY: this.state.moved}
                        ]
                    }
                ]}>
                <View style={styles.header}>
                    <Text style={[styles.title, this.getTitleStyle()]}>{this.getMessage()}</Text>
                </View>
                <GridView onFinished={this.onEachFinished.bind(this)}></GridView>
            </Animated.View>
        );
    }
}

SwipeUnlocker.propTypes = {
    stage: React.PropTypes.string
};
SwipeUnlocker.defaultProps = {
    stage: 'DEFAULT'
};

module.exports = SwipeUnlocker;
