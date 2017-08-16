/**
 * @file 手动解锁的格状视图的线区
 * @author Leo Wang(wangkemiao@baidu.com)
 */

import React, {Component} from 'react'

import {
    Animated,
    View,
    StyleSheet
} from 'react-native';

var styles = require('./styles');

class Lines extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lines: [{from: [0, 0], to: [30, 100]}]
        }
    }

    getLines() {
        var lines = this.state.lines;
        return lines.map(this.getLine.bind(this));
    }

    getLine(lineData) {
        var rx = lineData.to[0] - lineData.from[0];
        var ry = lineData.to[1] - lineData.from[1];
        var length = Math.sqrt(rx * rx + ry * ry);

        var degree = this.getDegree(lineData.from, lineData.to);
        return (
            <View style={[
                styles.line,
                {
                    left: lineData.from[0],
                    top: lineData.from[1],
                    height: length,
                    transform: [
                        {rotate: degree + 'deg'}
                    ]
                }
            ]} />
        );
    }

    getDegree(from, to){
        var rx = to[0] - from[0];
        var ry = to[1] - from[1];
        var radius = Math.sqrt(rx * rx + ry * ry);

        var helperPoint = {
          x: from[0],
          y: from[1] - radius
        }

        var dx = helperPoint[0] - to[0];
        var dy = helperPoint[1] - to[1];
        var d = Math.sqrt(dx * dx + dy * dy) / 2;

        return Math.round(2 * Math.asin(d/radius) * (dx > 0 ? -1 : 1) / Math.PI * 180);
    }

    render() {
        return (
            <View style={styles.lines}>
                {this.getLines()}
            </View>
        );
    }
}

module.exports = Lines;
