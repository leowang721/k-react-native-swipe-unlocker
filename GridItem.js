/**
 * @file 手动解锁的格状视图的单个元素
 * @author Leo Wang(wangkemiao@baidu.com)
 */

var React = require('react-native');

var {
    Animated,
    Component,
    View,
    Text,
    StyleSheet
} = React;

var styles = require('./styles');

class GridItem extends Component {

    constructor(props) {
        super(props);
        this.state = {
            viewState: 'default',
            rotateDegree: 0,
            bounceValue: new Animated.Value(1)
        };
    }

    getRotateDegree() {
        return this.state.rotateDegree + 'deg';
    }

    getPointerStyles() {
        return styles.gridItemPointerRight;
    }

    render() {
        return (
            <Animated.View
                style={[
                    styles.gridItem,
                    styles[this.state.viewState + 'GridItem']
                ]}>
                <View style={styles.gridItemInner}></View>
            </Animated.View>
        )
    }
}

// GridItem.propTypes = { initialCount: React.PropTypes.string };
// GridItem.defaultProps = {};

module.exports = GridItem;
